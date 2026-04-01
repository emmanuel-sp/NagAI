package com.nagai.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RateLimitFilterTest {

    @Test
    void authRateLimit_usesRemoteAddrByDefaultEvenWhenForwardedHeaderIsPresent() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(false);

        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
            request.setRemoteAddr("127.0.0.1");
            request.addHeader("X-Forwarded-For", "203.0.113." + i);
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilterInternal(request, response, new MockFilterChain());

            assertThat(response.getStatus()).isNotEqualTo(429);
        }

        MockHttpServletRequest blockedRequest = new MockHttpServletRequest("POST", "/auth/login");
        blockedRequest.setRemoteAddr("127.0.0.1");
        blockedRequest.addHeader("X-Forwarded-For", "198.51.100.25");
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();

        filter.doFilterInternal(blockedRequest, blockedResponse, new MockFilterChain());

        assertThat(blockedResponse.getStatus()).isEqualTo(429);
        assertThat(blockedResponse.getHeader("Retry-After")).isNotBlank();
    }

    @Test
    void resolveClientIp_usesForwardedHeaderOnlyWhenExplicitlyEnabled() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Forwarded-For", "203.0.113.10, 10.0.0.1");

        assertThat(new RateLimitFilter(false).resolveClientIp(request)).isEqualTo("127.0.0.1");
        assertThat(new RateLimitFilter(true).resolveClientIp(request)).isEqualTo("203.0.113.10");
    }
}
