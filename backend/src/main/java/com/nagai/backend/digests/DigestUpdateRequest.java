package com.nagai.backend.digests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class DigestUpdateRequest {
    @NotBlank(message = "name is required")
    private String name;
    private String description;
    @NotBlank(message = "frequency is required")
    private String frequency;
    @NotBlank(message = "deliveryTime is required")
    private String deliveryTime;
    @NotEmpty(message = "at least one content type is required")
    private String[] contentTypes;
}
