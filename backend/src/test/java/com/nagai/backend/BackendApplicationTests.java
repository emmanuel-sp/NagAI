package com.nagai.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
@TestPropertySource(properties = {
    "security.jwt.secret-key=dGVzdC1zZWNyZXQta2V5LWZvci11bml0LXRlc3Rpbmctb25seS1ub3Qtc2VjdXJlLXBhZGRpbmc="
})
class BackendApplicationTests {

	@MockitoBean
	private StringRedisTemplate redisTemplate;

	@Test
	void contextLoads() {
	}

}
