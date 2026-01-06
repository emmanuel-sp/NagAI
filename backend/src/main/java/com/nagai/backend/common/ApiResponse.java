package com.nagai.backend.common;

import org.springframework.http.HttpStatusCode;

import lombok.Data;

@Data
public class ApiResponse {
    public HttpStatusCode statusCode;
    public String statusMessage;

    public ApiResponse() {
        
    }
    public ApiResponse(HttpStatusCode statusCode, String statusMessage) {
        this.statusCode = statusCode;
        this.statusMessage = statusMessage;
    }
    
}
