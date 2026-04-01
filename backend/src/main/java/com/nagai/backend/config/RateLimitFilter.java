package com.nagai.backend.config;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Comparator;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);
    private static final Duration BUCKET_IDLE_TTL = Duration.ofHours(1);
    private static final int MAX_TRACKED_BUCKETS = 10_000;

    private final Map<String, BucketState> buckets = new ConcurrentHashMap<>();
    private final boolean useForwardedFor;

    public RateLimitFilter(@Value("${rate-limit.use-forwarded-for:false}") boolean useForwardedFor) {
        this.useForwardedFor = useForwardedFor;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator/") || path.startsWith("/internal/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        String key;
        BucketState bucketState;

        if (path.startsWith("/auth/")) {
            key = "auth:" + resolveClientIp(request);
            bucketState = buckets.compute(key, (ignored, existing) -> touch(existing, this::createAuthBucket));
        } else if (path.startsWith("/ai/")) {
            String userId = resolveUserId();
            if (userId == null) {
                // Not authenticated yet — let the security chain handle it
                filterChain.doFilter(request, response);
                return;
            }
            key = "ai:" + userId;
            bucketState = buckets.compute(key, (ignored, existing) -> touch(existing, this::createAiBucket));
        } else {
            String userId = resolveUserId();
            key = "general:" + (userId != null ? userId : resolveClientIp(request));
            bucketState = buckets.compute(key, (ignored, existing) -> touch(existing, this::createGeneralBucket));
        }

        ConsumptionProbe probe = bucketState.bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            response.setHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
            filterChain.doFilter(request, response);
        } else {
            long waitSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000 + 1;
            log.warn("Rate limit exceeded for key={} path={}", key, path);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(waitSeconds));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"Too many requests. Please try again later.\"}");
        }
    }

    BucketState touch(BucketState existing, java.util.function.Supplier<Bucket> bucketSupplier) {
        BucketState next = existing != null ? existing : new BucketState(bucketSupplier.get());
        next.lastSeenAt = Instant.now();
        return next;
    }

    String resolveClientIp(HttpServletRequest request) {
        if (useForwardedFor) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }

    private String resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }

    /** Auth endpoints: 10 requests per minute per IP */
    private Bucket createAuthBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.simple(10, Duration.ofMinutes(1)))
                .build();
    }

    /** AI endpoints: 20 requests per hour per user */
    private Bucket createAiBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.simple(20, Duration.ofHours(1)))
                .build();
    }

    /** General API: 100 requests per minute per user/IP */
    private Bucket createGeneralBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.simple(100, Duration.ofMinutes(1)))
                .build();
    }

    /** Evict expired buckets every 5 minutes to prevent memory leaks */
    @Scheduled(fixedRate = 300_000)
    public void evictExpiredBuckets() {
        long before = buckets.size();
        Instant cutoff = Instant.now().minus(BUCKET_IDLE_TTL);
        buckets.entrySet().removeIf(entry -> entry.getValue().lastSeenAt.isBefore(cutoff));
        trimToMaxTrackedBuckets();
        long evicted = before - buckets.size();
        if (evicted > 0) {
            log.debug("Evicted {} idle rate-limit buckets", evicted);
        }
    }

    private void trimToMaxTrackedBuckets() {
        int oversize = buckets.size() - MAX_TRACKED_BUCKETS;
        if (oversize <= 0) {
            return;
        }

        buckets.entrySet().stream()
                .sorted(Comparator.comparing(entry -> entry.getValue().lastSeenAt))
                .limit(oversize)
                .map(Map.Entry::getKey)
                .toList()
                .forEach(buckets::remove);
    }

    static final class BucketState {
        private final Bucket bucket;
        private volatile Instant lastSeenAt = Instant.now();

        private BucketState(Bucket bucket) {
            this.bucket = bucket;
        }
    }
}
