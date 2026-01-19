package com.nagai.backend.users;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.nagai.backend.exceptions.UserNotFoundException;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

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

    public List<User> allUsers() {
        List<User> users = new ArrayList<>();

        userRepository.findAll().forEach(users::add);

        return users;
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User currentUser = getUserByEmail(email);
        return currentUser;
    }

    public User updateUser(User user) {
        User identifiedUser = getUserByEmail(user.getEmail());
        identifiedUser.setFullName(user.getFullName());
        identifiedUser.setBio(user.getBio());
        identifiedUser.setPhoneNumber(user.getPhoneNumber());
        identifiedUser.setUserLocation(user.getUserLocation());
        identifiedUser.setCareer(user.getCareer());
        identifiedUser.setInterests(user.getInterests());
        identifiedUser.setHobbies(user.getHobbies());
        identifiedUser.setHabits(user.getHabits());
        return userRepository.save(identifiedUser);
    }
    
}
