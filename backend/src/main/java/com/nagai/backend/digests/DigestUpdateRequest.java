package com.nagai.backend.digests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DigestUpdateRequest {
    @NotBlank(message = "name is required")
    @Size(max = 100)
    private String name;
    @Size(max = 500)
    private String description;
    @NotBlank(message = "frequency is required")
    @Size(max = 20)
    private String frequency;
    @NotBlank(message = "deliveryTime is required")
    @Size(max = 10)
    private String deliveryTime;
    @NotEmpty(message = "at least one content type is required")
    private String[] contentTypes;
}
