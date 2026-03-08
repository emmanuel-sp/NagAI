package com.nagai.backend.digests;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/digest")
public class DigestController {

    private final DigestService digestService;

    public DigestController(DigestService digestService) {
        this.digestService = digestService;
    }

    @GetMapping
    public ResponseEntity<DigestResponse> getDigest() {
        return ResponseEntity.ok(DigestResponse.fromEntity(digestService.getDigest()));
    }

    @PostMapping
    public ResponseEntity<DigestResponse> createDigest(@Valid @RequestBody DigestAddRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(DigestResponse.fromEntity(digestService.createDigest(request)));
    }

    @PutMapping
    public ResponseEntity<DigestResponse> updateDigest(@Valid @RequestBody DigestUpdateRequest request) {
        return ResponseEntity.ok(DigestResponse.fromEntity(digestService.updateDigest(request)));
    }

    @PatchMapping("/toggle")
    public ResponseEntity<DigestResponse> toggleDigest() {
        return ResponseEntity.ok(DigestResponse.fromEntity(digestService.toggleDigest()));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteDigest() {
        digestService.deleteDigest();
        return ResponseEntity.noContent().build();
    }
}
