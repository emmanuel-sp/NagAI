package com.nagai.backend.digests;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class DigestResponse {
    private Long digestId;
    private String name;
    private String description;
    private String frequency;
    private String deliveryTime;
    private String[] contentTypes;
    private boolean active;
    private String pauseReason;
    private LocalDateTime createdAt;
    private LocalDateTime lastDeliveredAt;
    private LocalDateTime nextDeliveryAt;

    public static DigestResponse fromEntity(Digest digest) {
        DigestResponse response = new DigestResponse();
        response.setDigestId(digest.getDigestId());
        response.setName(digest.getName());
        response.setDescription(digest.getDescription());
        response.setFrequency(digest.getFrequency());
        response.setDeliveryTime(digest.getDeliveryTime());
        response.setContentTypes(digest.getContentTypes());
        response.setActive(digest.isActive());
        response.setPauseReason(digest.getPauseReason());
        response.setCreatedAt(digest.getCreatedAt());
        response.setLastDeliveredAt(digest.getLastDeliveredAt());
        response.setNextDeliveryAt(digest.getNextDeliveryAt());
        return response;
    }
}
