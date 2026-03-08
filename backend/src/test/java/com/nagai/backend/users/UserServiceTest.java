package com.nagai.backend.users;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.nagai.backend.exceptions.InvalidPasswordException;
import com.nagai.backend.exceptions.UserNotFoundException;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUserId(1L);
        user.setEmail("test@example.com");
        user.setFullName("Test User");
        user.setPassword("hashed_password");
    }

    private void mockCurrentUser() {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("test@example.com");
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
    }

    @Test
    void getCurrentUser_returnsUserByEmail() {
        mockCurrentUser();

        User result = userService.getCurrentUser();

        assertThat(result.getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void getUserByEmail_throwsNotFoundWhenMissing() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserByEmail("missing@example.com"))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void changePassword_succeedsWithCorrectCurrentPassword() {
        mockCurrentUser();

        PasswordChangeRequest request = new PasswordChangeRequest();
        request.setCurrentPassword("correctPassword");
        request.setNewPassword("newSecurePassword");

        when(passwordEncoder.matches("correctPassword", "hashed_password")).thenReturn(true);
        when(passwordEncoder.encode("newSecurePassword")).thenReturn("new_hashed_password");

        userService.changePassword(request);

        assertThat(user.getPassword()).isEqualTo("new_hashed_password");
        verify(userRepository).save(user);
    }

    @Test
    void changePassword_throwsInvalidPasswordWhenCurrentPasswordIsWrong() {
        mockCurrentUser();

        PasswordChangeRequest request = new PasswordChangeRequest();
        request.setCurrentPassword("wrongPassword");
        request.setNewPassword("newSecurePassword");

        when(passwordEncoder.matches("wrongPassword", "hashed_password")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword(request))
                .isInstanceOf(InvalidPasswordException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUser_updatesAllFields() {
        mockCurrentUser();

        UserRequest request = new UserRequest();
        request.setFullName("Updated Name");
        request.setBio("My bio");
        request.setPhoneNumber("+1234567890");
        request.setCareer("Engineer");

        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.updateUser(request);

        assertThat(result.getFullName()).isEqualTo("Updated Name");
        assertThat(result.getBio()).isEqualTo("My bio");
        assertThat(result.getPhoneNumber()).isEqualTo("+1234567890");
        assertThat(result.getCareer()).isEqualTo("Engineer");
        verify(userRepository).save(user);
    }
}
