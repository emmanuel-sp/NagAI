package com.nagai.backend.config;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

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
        Bucket bucket;

        if (path.startsWith("/auth/")) {
            key = "auth:" + resolveClientIp(request);
            bucket = buckets.computeIfAbsent(key, k -> createAuthBucket());
        } else if (path.startsWith("/ai/")) {
            String userId = resolveUserId();
            if (userId == null) {
                // Not authenticated yet — let the security chain handle it
                filterChain.doFilter(request, response);
                return;
            }
            key = "ai:" + userId;
            bucket = buckets.computeIfAbsent(key, k -> createAiBucket());
        } else {
            String userId = resolveUserId();
            key = "general:" + (userId != null ? userId : resolveClientIp(request));
            bucket = buckets.computeIfAbsent(key, k -> createGeneralBucket());
        }

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
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

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
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
        buckets.entrySet().removeIf(entry -> {
            Bucket b = entry.getValue();
            // If the bucket has all tokens available, it's idle — safe to evict
            return b.getAvailableTokens() == getCapacity(entry.getKey());
        });
        long evicted = before - buckets.size();
        if (evicted > 0) {
            log.debug("Evicted {} idle rate-limit buckets", evicted);
        }
    }

    private long getCapacity(String key) {
        if (key.startsWith("auth:")) return 10;
        if (key.startsWith("ai:")) return 20;
        return 100;
    }
}
