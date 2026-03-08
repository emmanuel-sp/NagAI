package com.nagai.backend.exceptions;

public class AiServiceException extends RuntimeException {
    public AiServiceException() { super(); }
    public AiServiceException(String message) { super(message); }
    public AiServiceException(String message, Throwable cause) { super(message, cause); }
}
