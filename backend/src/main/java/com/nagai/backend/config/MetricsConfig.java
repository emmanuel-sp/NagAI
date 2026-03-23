package com.nagai.backend.config;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MetricsConfig {

    @Bean
    public Counter digestsSentCounter(MeterRegistry registry) {
        return Counter.builder("nagai.digests.sent")
                .description("Number of digests successfully published to stream")
                .register(registry);
    }

    @Bean
    public Counter digestsFailedCounter(MeterRegistry registry) {
        return Counter.builder("nagai.digests.failed")
                .description("Number of digest publish failures")
                .register(registry);
    }

    @Bean
    public Counter agentMessagesSentCounter(MeterRegistry registry) {
        return Counter.builder("nagai.agent_messages.sent")
                .description("Number of agent messages successfully published to stream")
                .register(registry);
    }

    @Bean
    public Counter agentMessagesFailedCounter(MeterRegistry registry) {
        return Counter.builder("nagai.agent_messages.failed")
                .description("Number of agent message publish failures")
                .register(registry);
    }

    @Bean
    public Counter grpcErrorsCounter(MeterRegistry registry) {
        return Counter.builder("nagai.grpc.errors")
                .description("Number of gRPC call failures to AI service")
                .register(registry);
    }
}
