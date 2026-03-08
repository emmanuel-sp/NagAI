package com.nagai.backend.exceptions;

public class InvalidPasswordException extends UserException {
    public InvalidPasswordException() { super("Current password is incorrect"); }
}
