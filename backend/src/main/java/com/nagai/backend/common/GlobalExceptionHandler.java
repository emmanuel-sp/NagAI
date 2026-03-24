package com.nagai.backend.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AccountStatusException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.nagai.backend.exceptions.AgentContextLimitException;
import com.nagai.backend.exceptions.AgentContextNotFoundException;
import com.nagai.backend.exceptions.AgentException;
import com.nagai.backend.exceptions.AiServiceException;
import com.nagai.backend.exceptions.ChecklistException;
import com.nagai.backend.exceptions.DailyChecklistAlreadyExistsException;
import com.nagai.backend.exceptions.DailyChecklistException;
import com.nagai.backend.exceptions.DailyChecklistItemNotFoundException;
import com.nagai.backend.exceptions.ChecklistLimitException;
import com.nagai.backend.exceptions.ChecklistNotFoundException;
import com.nagai.backend.exceptions.DigestAlreadyExistsException;
import com.nagai.backend.exceptions.DigestException;
import com.nagai.backend.exceptions.DigestNotFoundException;
import com.nagai.backend.exceptions.EmailAlreadyExistsException;
import com.nagai.backend.exceptions.GoalException;
import com.nagai.backend.exceptions.GoalLimitException;
import com.nagai.backend.exceptions.GoalNotFoundException;
import com.nagai.backend.exceptions.EmailNotVerifiedException;
import com.nagai.backend.exceptions.InvalidPasswordException;
import com.nagai.backend.exceptions.UserException;
import com.nagai.backend.exceptions.UserNotFoundException;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.security.SignatureException;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationException(MethodArgumentNotValidException exception) {
        String errors = exception.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining(", "));
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(400), errors);
        detail.setProperty("description", "Validation failed");
        return detail;
    }

    @ExceptionHandler(GoalException.class)
    public ProblemDetail handleGoalException(GoalException exception) {
        if (exception instanceof GoalNotFoundException) {
            ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
            detail.setProperty("description", "The requested goal does not exist");
            return detail;
        }
        if (exception instanceof GoalLimitException) {
            ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
            detail.setProperty("description", "Maximum number of goals reached");
            return detail;
        }
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, exception.getMessage());
        detail.setProperty("description", "A goal-related error occurred");
        return detail;
    }

    @ExceptionHandler(UserException.class)
    public ProblemDetail handleUserException(UserException exception) {
        if (exception instanceof UserNotFoundException) {
            ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
            detail.setProperty("description", "The requested user does not exist");
            return detail;
        }
        if (exception instanceof InvalidPasswordException) {
            ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
            detail.setProperty("description", "The provided password is incorrect");
            return detail;
        }
        if (exception instanceof EmailNotVerifiedException) {
            ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, exception.getMessage());
            detail.setProperty("description", "Email verification required");
            detail.setProperty("errorCode", "EMAIL_NOT_VERIFIED");
            return detail;
        }
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, exception.getMessage());
        detail.setProperty("description", "A user-related error occurred");
        return detail;
    }

    @ExceptionHandler(ChecklistException.class)
    public ProblemDetail handleChecklistException(ChecklistException exception) {
        if (exception instanceof ChecklistNotFoundException) {
            ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
            detail.setProperty("description", "The requested checklist item does not exist");
            return detail;
        }
        if (exception instanceof ChecklistLimitException) {
            ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
            detail.setProperty("description", "Maximum number of checklist items per goal reached");
            return detail;
        }
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, exception.getMessage());
        detail.setProperty("description", "A checklist-related error occurred");
        return detail;
    }

    @ExceptionHandler(DigestException.class)
    public ProblemDetail handleDigestException(DigestException exception) {
        if (exception instanceof DigestNotFoundException) {
            ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
            detail.setProperty("description", "No digest is configured for this user");
            return detail;
        }
        if (exception instanceof DigestAlreadyExistsException) {
            ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
            detail.setProperty("description", "A digest is already configured for this user");
            return detail;
        }
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, exception.getMessage());
        detail.setProperty("description", "A digest-related error occurred");
        return detail;
    }

    @ExceptionHandler(AgentException.class)
    public ProblemDetail handleAgentException(AgentException exception) {
        if (exception instanceof AgentContextNotFoundException) {
            ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
            detail.setProperty("description", "The requested agent context does not exist");
            return detail;
        }
        if (exception instanceof AgentContextLimitException) {
            ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
            detail.setProperty("description", "Maximum number of agent contexts reached");
            return detail;
        }
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, exception.getMessage());
        detail.setProperty("description", "An agent-related error occurred");
        return detail;
    }

    @ExceptionHandler(DailyChecklistException.class)
    public ProblemDetail handleDailyChecklistException(DailyChecklistException exception) {
        if (exception instanceof DailyChecklistItemNotFoundException) {
            ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
            detail.setProperty("description", "The requested daily checklist item does not exist");
            return detail;
        }
        if (exception instanceof DailyChecklistAlreadyExistsException) {
            ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
            detail.setProperty("description", "A daily checklist already exists for today");
            return detail;
        }
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, exception.getMessage());
        detail.setProperty("description", "A daily checklist error occurred");
        return detail;
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ProblemDetail handleEmailAlreadyExists(EmailAlreadyExistsException exception) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
        detail.setProperty("description", "This email is already registered");
        return detail;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException exception) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, exception.getMessage());
        detail.setProperty("description", "You are not authorized to perform this action");
        return detail;
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException exception) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "The username or password is incorrect");
        detail.setProperty("description", "Authentication failed");
        return detail;
    }

    @ExceptionHandler(AccountStatusException.class)
    public ProblemDetail handleAccountStatus(AccountStatusException exception) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, exception.getMessage());
        detail.setProperty("description", "The account is locked or disabled");
        return detail;
    }

    @ExceptionHandler(SignatureException.class)
    public ProblemDetail handleSignatureException(SignatureException exception) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "Invalid JWT signature");
        detail.setProperty("description", "The JWT signature is invalid");
        return detail;
    }

    @ExceptionHandler(ExpiredJwtException.class)
    public ProblemDetail handleExpiredJwt(ExpiredJwtException exception) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "JWT token has expired");
        detail.setProperty("description", "Please log in again");
        return detail;
    }

    @ExceptionHandler(AiServiceException.class)
    public ProblemDetail handleAiServiceException(AiServiceException exception) {
        log.warn("AI service unavailable: {}", exception.getMessage());
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
        detail.setProperty("description", "The AI service is currently unavailable");
        detail.setProperty("correlationId", MDC.get("correlationId"));
        return detail;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnknown(Exception exception) {
        String correlationId = MDC.get("correlationId");
        log.error("Unhandled exception [correlationId={}]: {} — {}",
                correlationId, exception.getClass().getSimpleName(), exception.getMessage(), exception);
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
        detail.setProperty("description", "Internal server error");
        detail.setProperty("correlationId", correlationId);
        return detail;
    }
}
