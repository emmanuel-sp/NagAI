package com.nagai.backend.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Verify your NagAI account");
        message.setText(
            "Welcome to NagAI!\n\n" +
            "Click the link below to verify your email address:\n\n" +
            baseUrl + "/verify?token=" + token + "\n\n" +
            "This link expires in 24 hours.\n\n" +
            "If you didn't create a NagAI account, you can ignore this email."
        );
        mailSender.send(message);
    }
}
