package com.nagai.backend.users;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/users")
@Validated
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getUser() {
        User currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(new UserResponse(currentUser));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> putUser(@Valid @RequestBody UserRequest request) {
        User updated = userService.updateUser(request);
        return ResponseEntity.ok(new UserResponse(updated));
    }

    @PostMapping("/me/onboarding/complete")
    public ResponseEntity<UserResponse> completeOnboarding(@Valid @RequestBody UserRequest request) {
        User updated = userService.completeOnboarding(request);
        return ResponseEntity.ok(new UserResponse(updated));
    }

    @PostMapping("/me/onboarding/skip")
    public ResponseEntity<UserResponse> skipOnboarding() {
        User updated = userService.skipOnboarding();
        return ResponseEntity.ok(new UserResponse(updated));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody PasswordChangeRequest request) {
        userService.changePassword(request);
        return ResponseEntity.noContent().build();
    }

}
