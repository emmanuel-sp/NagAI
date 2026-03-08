package com.nagai.backend.exceptions;

public class DigestAlreadyExistsException extends DigestException {
    public DigestAlreadyExistsException() { super("A digest is already configured for this user"); }
    public DigestAlreadyExistsException(String message) { super(message); }
}
