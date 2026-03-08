package com.nagai.backend.digests;

import org.springframework.stereotype.Service;

import com.nagai.backend.exceptions.DigestAlreadyExistsException;
import com.nagai.backend.exceptions.DigestNotFoundException;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;

@Service
public class DigestService {

    private final DigestRepository digestRepository;
    private final UserService userService;

    public DigestService(DigestRepository digestRepository, UserService userService) {
        this.digestRepository = digestRepository;
        this.userService = userService;
    }

    public Digest getDigest() {
        User user = userService.getCurrentUser();
        return digestRepository.findByUserId(user.getUserId())
                .orElseThrow(DigestNotFoundException::new);
    }

    public Digest createDigest(DigestAddRequest request) {
        User user = userService.getCurrentUser();
        if (digestRepository.existsByUserId(user.getUserId())) {
            throw new DigestAlreadyExistsException();
        }
        Digest digest = new Digest();
        digest.setUserId(user.getUserId());
        applyFields(digest, request.getName(), request.getDescription(),
                request.getFrequency(), request.getDeliveryTime(), request.getContentTypes());
        return digestRepository.save(digest);
    }

    public Digest updateDigest(DigestUpdateRequest request) {
        User user = userService.getCurrentUser();
        Digest digest = digestRepository.findByUserId(user.getUserId())
                .orElseThrow(DigestNotFoundException::new);
        applyFields(digest, request.getName(), request.getDescription(),
                request.getFrequency(), request.getDeliveryTime(), request.getContentTypes());
        return digestRepository.save(digest);
    }

    public Digest toggleDigest() {
        User user = userService.getCurrentUser();
        Digest digest = digestRepository.findByUserId(user.getUserId())
                .orElseThrow(DigestNotFoundException::new);
        digest.setActive(!digest.isActive());
        return digestRepository.save(digest);
    }

    public void deleteDigest() {
        User user = userService.getCurrentUser();
        Digest digest = digestRepository.findByUserId(user.getUserId())
                .orElseThrow(DigestNotFoundException::new);
        digestRepository.delete(digest);
    }

    private void applyFields(Digest digest, String name, String description,
                              String frequency, String deliveryTime, String[] contentTypes) {
        digest.setName(name);
        digest.setDescription(description);
        digest.setFrequency(frequency);
        digest.setDeliveryTime(deliveryTime);
        digest.setContentTypes(contentTypes);
    }
}
