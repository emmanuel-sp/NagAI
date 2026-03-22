package com.nagai.backend.users;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.nagai.backend.exceptions.InvalidPasswordException;
import com.nagai.backend.exceptions.UserNotFoundException;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(String name, String email, String hashedPassword) {
        User user = new User();
        user.setFullName(name);
        user.setEmail(email);
        user.setPassword(hashedPassword);
        return userRepository.save(user);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new UserNotFoundException());
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return getUserByEmail(email);
    }

    public User updateUser(UserRequest request) {
        User currentUser = getCurrentUser();
        currentUser.setFullName(request.getFullName());
        currentUser.setBio(request.getBio());
        currentUser.setPhoneNumber(request.getPhoneNumber());
        currentUser.setUserLocation(request.getUserLocation());
        currentUser.setCareer(request.getCareer());
        currentUser.setInterests(request.getInterests());
        currentUser.setHobbies(request.getHobbies());
        currentUser.setHabits(request.getHabits());
        currentUser.setAge(request.getAge());
        currentUser.setLifeContext(request.getLifeContext());
        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            currentUser.setTimezone(request.getTimezone());
        }
        return userRepository.save(currentUser);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public User findOrCreateGoogleUser(String email, String name, String googleId) {
        return userRepository.findByGoogleId(googleId)
            .orElseGet(() -> userRepository.findByEmail(email)
                .map(user -> {
                    user.setGoogleId(googleId);
                    user.setEmailVerified(true);
                    return userRepository.save(user);
                })
                .orElseGet(() -> {
                    User user = new User();
                    user.setFullName(name);
                    user.setEmail(email);
                    user.setGoogleId(googleId);
                    user.setEmailVerified(true); // Google already verified the email
                    // Random password so the account can't be brute-forced via email/password login
                    user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                    return userRepository.save(user);
                })
            );
    }

    public User completeOnboarding(UserRequest profileData) {
        User currentUser = getCurrentUser();
        if (profileData.getFullName() != null) currentUser.setFullName(profileData.getFullName());
        currentUser.setBio(profileData.getBio());
        currentUser.setCareer(profileData.getCareer());
        currentUser.setAge(profileData.getAge());
        currentUser.setLifeContext(profileData.getLifeContext());
        currentUser.setInterests(profileData.getInterests());
        currentUser.setHobbies(profileData.getHobbies());
        currentUser.setHabits(profileData.getHabits());
        if (profileData.getTimezone() != null && !profileData.getTimezone().isBlank()) {
            currentUser.setTimezone(profileData.getTimezone());
        }
        currentUser.setOnboardingCompleted(true);
        return userRepository.save(currentUser);
    }

    public User skipOnboarding() {
        User currentUser = getCurrentUser();
        currentUser.setOnboardingCompleted(true);
        return userRepository.save(currentUser);
    }

    public void changePassword(PasswordChangeRequest request) {
        User user = getCurrentUser();
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidPasswordException();
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
