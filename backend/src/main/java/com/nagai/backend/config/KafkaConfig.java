package com.nagai.backend.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    public static final String TOPIC_DIGEST_DELIVERY = "digest-delivery";
    public static final String TOPIC_AGENT_MESSAGES  = "agent-messages";

    @Bean
    public NewTopic digestDeliveryTopic() {
        return TopicBuilder.name(TOPIC_DIGEST_DELIVERY).partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic agentMessagesTopic() {
        return TopicBuilder.name(TOPIC_AGENT_MESSAGES).partitions(1).replicas(1).build();
    }

    // KafkaTemplate<String, String> is fully autoconfigured from application.properties.
    // Steps 9+10 inject it directly via @Autowired KafkaTemplate<String, String>.
}
