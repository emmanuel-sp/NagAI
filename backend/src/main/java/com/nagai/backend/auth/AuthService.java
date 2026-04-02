package com.nagai.backend.auth;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.nagai.backend.common.TokenHashService;
import com.nagai.backend.exceptions.EmailAlreadyExistsException;
import com.nagai.backend.exceptions.EmailNotVerifiedException;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserRepository;
import com.nagai.backend.users.UserService;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Value("${google.client-id}")
    private String googleClientId;

    private final PasswordEncoder passwordEncoder;
    private final UserService userService;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final RestTemplate restTemplate;
    private final TokenHashService tokenHashService;

    public AuthService(PasswordEncoder passwordEncoder, UserService userService, UserRepository userRepository,
                       AuthenticationManager authenticationManager, EmailService emailService,
                       RestTemplate externalRestTemplate, TokenHashService tokenHashService) {
        this.passwordEncoder = passwordEncoder;
        this.userService = userService;
        this.userRepository = userRepository;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
        this.restTemplate = externalRestTemplate;
        this.tokenHashService = tokenHashService;
    }

    public User registerUser(RegisterRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(existing -> {
            if (existing.isEmailVerified()) {
                throw new EmailAlreadyExistsException("This email is already registered");
            }
            // Unverified account — delete it so the user can re-register cleanly
            userRepository.delete(existing);
        });

        String hashedPassword = passwordEncoder.encode(request.password());
        User user = userService.createUser(request.name(), request.email(), hashedPassword);
        issueVerificationEmail(user, "registration");

        return user;
    }

    public void resendVerificationEmail(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.isEmailVerified()) {
                log.info("Verification resend skipped for already-verified email={}", email);
                return;
            }

            issueVerificationEmail(user, "resend");
        });
    }

    public User loginUser(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        User user = userService.getUserByEmail(request.email());
        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException();
        }
        return user;
    }

    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationTokenHash(tokenHashService.hash(token))
            .or(() -> userRepository.findByVerificationToken(token))
            .orElseThrow(() -> new BadCredentialsException("Invalid or expired verification token"));

        if (user.getVerificationTokenExpiry() == null || user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            userRepository.delete(user);
            throw new BadCredentialsException("Verification token has expired. Please sign up again.");
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenHash(null);
        user.setVerificationTokenExpiry(null);
        userService.save(user);
    }

    @SuppressWarnings("unchecked")
    public User loginWithGoogle(GoogleAuthRequest request) {
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + request.idToken();
        Map<String, Object> tokenInfo;
        try {
            tokenInfo = restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            throw new BadCredentialsException("Google authentication failed");
        }

        if (tokenInfo == null || !googleClientId.equals(tokenInfo.get("aud"))) {
            throw new BadCredentialsException("Google token is invalid or not issued for this application");
        }

        if (!"true".equals(String.valueOf(tokenInfo.get("email_verified")))) {
            throw new BadCredentialsException("Google account email is not verified");
        }

        String email = (String) tokenInfo.get("email");
        String name = tokenInfo.containsKey("name") ? (String) tokenInfo.get("name") : email;
        String googleId = (String) tokenInfo.get("sub");

        return userService.findOrCreateGoogleUser(email, name, googleId);
    }

    private void issueVerificationEmail(User user, String reason) {
        String token = UUID.randomUUID().toString();
        user.setVerificationToken(null);
        user.setVerificationTokenHash(tokenHashService.hash(token));
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
        userService.save(user);

        try {
            emailService.sendVerificationEmail(user.getEmail(), token);
            log.info("Verification email queued for email={} reason={}", user.getEmail(), reason);
        } catch (Exception e) {
            log.warn("Verification email failed for email={} reason={}", user.getEmail(), reason, e);
        }
    }
}
