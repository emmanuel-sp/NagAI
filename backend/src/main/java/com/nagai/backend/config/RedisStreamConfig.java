package com.nagai.backend.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class RedisStreamConfig {

    public static final String STREAM_DIGEST_DELIVERY = "digest-delivery";
    public static final String STREAM_AGENT_MESSAGES  = "agent-messages";
    public static final String STREAM_USER_EVENTS     = "user-events";
}
