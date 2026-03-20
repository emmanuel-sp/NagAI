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
import org.springframework.web.bind.annotation.RequestParam;
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

    @GetMapping("/unsubscribe")
    public ResponseEntity<String> unsubscribe(@RequestParam String token) {
        try {
            digestService.unsubscribeByToken(token);
            return ResponseEntity.ok(UNSUBSCRIBE_HTML);
        } catch (Exception e) {
            return ResponseEntity.ok(UNSUBSCRIBE_ERROR_HTML);
        }
    }

    private static final String UNSUBSCRIBE_HTML = """
            <!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribed</title>
            <style>body{font-family:'Segoe UI',sans-serif;background:#faf5f4;display:flex;
            align-items:center;justify-content:center;min-height:100vh;margin:0;}
            .card{background:#fff;padding:48px;border-radius:12px;text-align:center;
            box-shadow:0 2px 12px rgba(0,0,0,0.08);max-width:400px;}
            h1{color:#2a1f1e;font-size:24px;margin:0 0 12px;}
            p{color:#6b5550;font-size:15px;line-height:1.6;margin:0;}</style></head>
            <body><div class="card"><h1>You've been unsubscribed</h1>
            <p>You will no longer receive digest emails from NagAI. You can re-enable your digest anytime from the app.</p>
            </div></body></html>""";

    private static final String UNSUBSCRIBE_ERROR_HTML = """
            <!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribe</title>
            <style>body{font-family:'Segoe UI',sans-serif;background:#faf5f4;display:flex;
            align-items:center;justify-content:center;min-height:100vh;margin:0;}
            .card{background:#fff;padding:48px;border-radius:12px;text-align:center;
            box-shadow:0 2px 12px rgba(0,0,0,0.08);max-width:400px;}
            h1{color:#2a1f1e;font-size:24px;margin:0 0 12px;}
            p{color:#6b5550;font-size:15px;line-height:1.6;margin:0;}</style></head>
            <body><div class="card"><h1>Link expired or invalid</h1>
            <p>This unsubscribe link is no longer valid. You can manage your digest settings from the NagAI app.</p>
            </div></body></html>""";
}
