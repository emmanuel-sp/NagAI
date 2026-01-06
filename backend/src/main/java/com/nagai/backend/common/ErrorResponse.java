package com.nagai.backend.common;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ErrorResponse {
    private String errorCode;
    private String message;
    private int statusCode;
    private LocalDateTime timestamp;
}
