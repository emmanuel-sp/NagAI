package com.nagai.backend.exceptions;

public class DigestNotFoundException extends DigestException {
    public DigestNotFoundException() { super("Digest not found"); }
    public DigestNotFoundException(String message) { super(message); }
}
