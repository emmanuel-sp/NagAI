package com.nagai.backend.exceptions;

public class DigestException extends RuntimeException {
    public DigestException() { super(); }
    public DigestException(String message) { super(message); }
    public DigestException(String message, Throwable cause) { super(message, cause); }
}
