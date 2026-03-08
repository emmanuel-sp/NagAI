package com.nagai.backend.exceptions;

public class EmailNotVerifiedException extends UserException {
    public EmailNotVerifiedException() { super("Please verify your email address before logging in"); }
}
