package com.nagai.backend.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.nagai.backend.exceptions.EmailAlreadyExistsException;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserRepository;
import com.nagai.backend.users.UserService;


@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;
    
    private final UserService userService;

    private final AuthenticationManager authenticationManager;

    

    public AuthService(PasswordEncoder passwordEncoder, UserService userService, AuthenticationManager authenticationManager) {
        this.passwordEncoder = passwordEncoder;
        this.userService = userService;
        this.authenticationManager = authenticationManager;
    }
    
    public User registerUser(RegisterRequest registerRequest) {
        String hashedPassword = passwordEncoder.encode(registerRequest.getPassword());
        User user = null;
        try {
            user = userService.createUser(registerRequest.getName(), registerRequest.getEmail(), hashedPassword);
        } catch (RuntimeException e) {
            throw new RuntimeException("Failed to register user");
        }
        
        return user;
     
    }

    public User loginUser(LoginRequest loginRequest) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getEmail(),
                loginRequest.getPassword()
            )
        );
        return userRepository.findByEmail(loginRequest.getEmail()).orElseThrow();

    }

    

}
