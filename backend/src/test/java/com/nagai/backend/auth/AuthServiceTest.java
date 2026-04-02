package com.nagai.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestTemplate;

import com.nagai.backend.common.TokenHashService;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserRepository;
import com.nagai.backend.users.UserService;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private EmailService emailService;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private TokenHashService tokenHashService;

    @InjectMocks
    private AuthService authService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUserId(1L);
        user.setEmail("test@example.com");
        user.setPassword("hashedPassword");
        user.setFullName("Test User");
        user.setEmailVerified(true);
    }

    @Test
    void registerUser_createsAndReturnsUser() {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "plaintext1");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("plaintext1")).thenReturn("hashedPassword");
        when(userService.createUser("Test User", "test@example.com", "hashedPassword")).thenReturn(user);
        when(tokenHashService.hash(anyString())).thenReturn("hashed-token");

        User result = authService.registerUser(request);

        assertThat(result.getEmail()).isEqualTo("test@example.com");
        assertThat(result.getFullName()).isEqualTo("Test User");
        assertThat(result.getVerificationToken()).isNull();
        assertThat(result.getVerificationTokenHash()).isEqualTo("hashed-token");
        assertThat(result.getVerificationTokenExpiry()).isNotNull();
        verify(passwordEncoder).encode("plaintext1");
        verify(userService).createUser("Test User", "test@example.com", "hashedPassword");
        verify(userService).save(user);
        verify(emailService).sendVerificationEmail(eq("test@example.com"), anyString());
    }

    @Test
    void registerUser_propagatesExceptionOnFailure() {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "plaintext1");

        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashedPassword");
        when(userService.createUser(any(), any(), any())).thenThrow(new RuntimeException("DB error"));

        assertThatThrownBy(() -> authService.registerUser(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("DB error");
    }

    @Test
    void verifyEmail_supportsLegacyPlaintextTokensDuringMigration() {
        user.setEmailVerified(false);
        user.setVerificationToken("legacy-token");
        user.setVerificationTokenExpiry(java.time.LocalDateTime.now().plusHours(1));

        when(tokenHashService.hash("legacy-token")).thenReturn("hashed-legacy-token");
        when(userRepository.findByVerificationTokenHash("hashed-legacy-token")).thenReturn(Optional.empty());
        when(userRepository.findByVerificationToken("legacy-token")).thenReturn(Optional.of(user));

        authService.verifyEmail("legacy-token");

        assertThat(user.isEmailVerified()).isTrue();
        assertThat(user.getVerificationToken()).isNull();
        assertThat(user.getVerificationTokenHash()).isNull();
        assertThat(user.getVerificationTokenExpiry()).isNull();
        verify(userService).save(user);
    }

    @Test
    void resendVerificationEmail_reissuesTokenForUnverifiedUser() {
        user.setEmailVerified(false);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(1));

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(tokenHashService.hash(anyString())).thenReturn("new-hashed-token");

        authService.resendVerificationEmail("test@example.com");

        assertThat(user.getVerificationToken()).isNull();
        assertThat(user.getVerificationTokenHash()).isEqualTo("new-hashed-token");
        assertThat(user.getVerificationTokenExpiry()).isAfter(LocalDateTime.now());
        verify(userService).save(user);
        verify(emailService).sendVerificationEmail(eq("test@example.com"), anyString());
    }

    @Test
    void resendVerificationEmail_doesNothingForVerifiedUser() {
        user.setEmailVerified(true);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        authService.resendVerificationEmail("test@example.com");

        verify(tokenHashService, never()).hash(anyString());
        verify(userService, never()).save(any());
        verify(emailService, never()).sendVerificationEmail(anyString(), anyString());
    }

    @Test
    void resendVerificationEmail_doesNothingForUnknownUser() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        authService.resendVerificationEmail("missing@example.com");

        verify(tokenHashService, never()).hash(anyString());
        verify(userService, never()).save(any());
        verify(emailService, never()).sendVerificationEmail(anyString(), anyString());
    }

    @Test
    void loginUser_authenticatesAndReturnsUser() {
        LoginRequest request = new LoginRequest("test@example.com", "plaintext1");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(null);
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);

        User result = authService.loginUser(request);

        assertThat(result.getEmail()).isEqualTo("test@example.com");
        verify(authenticationManager).authenticate(
                argThat(token -> token.getPrincipal().equals("test@example.com")
                        && token.getCredentials().equals("plaintext1"))
        );
    }

    @Test
    void loginUser_throwsBadCredentialsOnInvalidPassword() {
        LoginRequest request = new LoginRequest("test@example.com", "wrongpassword");

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.loginUser(request))
                .isInstanceOf(BadCredentialsException.class);

        verify(userService, never()).getUserByEmail(any());
    }
}
