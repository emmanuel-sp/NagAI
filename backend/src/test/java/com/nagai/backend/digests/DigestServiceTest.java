package com.nagai.backend.digests;

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

import com.nagai.backend.exceptions.DigestAlreadyExistsException;
import com.nagai.backend.exceptions.DigestNotFoundException;
import com.nagai.backend.users.User;
import com.nagai.backend.users.UserService;

@ExtendWith(MockitoExtension.class)
class DigestServiceTest {

    @Mock
    private DigestRepository digestRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private DigestService digestService;

    private User user;
    private Digest digest;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUserId(1L);
        user.setEmail("test@example.com");

        digest = new Digest();
        digest.setDigestId(10L);
        digest.setUserId(1L);
        digest.setName("My Digest");
        digest.setFrequency("daily");
        digest.setDeliveryTime("morning");
        digest.setContentTypes(new String[]{"affirmations", "tips"});
        digest.setActive(false);
    }

    @Test
    void getDigest_returnsDigestForCurrentUser() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(digestRepository.findByUserId(1L)).thenReturn(Optional.of(digest));

        Digest result = digestService.getDigest();

        assertThat(result.getDigestId()).isEqualTo(10L);
        assertThat(result.getName()).isEqualTo("My Digest");
    }

    @Test
    void getDigest_throwsNotFoundWhenNoneConfigured() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(digestRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> digestService.getDigest())
                .isInstanceOf(DigestNotFoundException.class);
    }

    @Test
    void createDigest_savesAndReturnsDigest() {
        DigestAddRequest request = new DigestAddRequest();
        request.setName("New Digest");
        request.setFrequency("weekly");
        request.setDeliveryTime("evening");
        request.setContentTypes(new String[]{"tips"});

        when(userService.getCurrentUser()).thenReturn(user);
        when(digestRepository.existsByUserId(1L)).thenReturn(false);
        when(digestRepository.save(any(Digest.class))).thenAnswer(inv -> inv.getArgument(0));

        Digest result = digestService.createDigest(request);

        assertThat(result.getUserId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("New Digest");
        assertThat(result.getFrequency()).isEqualTo("weekly");
        verify(digestRepository).save(any(Digest.class));
    }

    @Test
    void createDigest_throwsConflictWhenAlreadyExists() {
        DigestAddRequest request = new DigestAddRequest();
        request.setName("Duplicate");
        request.setFrequency("daily");
        request.setDeliveryTime("morning");
        request.setContentTypes(new String[]{"tips"});

        when(userService.getCurrentUser()).thenReturn(user);
        when(digestRepository.existsByUserId(1L)).thenReturn(true);

        assertThatThrownBy(() -> digestService.createDigest(request))
                .isInstanceOf(DigestAlreadyExistsException.class);

        verify(digestRepository, never()).save(any());
    }

    @Test
    void updateDigest_updatesFields() {
        DigestUpdateRequest request = new DigestUpdateRequest();
        request.setName("Updated Digest");
        request.setFrequency("monthly");
        request.setDeliveryTime("afternoon");
        request.setContentTypes(new String[]{"news", "affirmations"});

        when(userService.getCurrentUser()).thenReturn(user);
        when(digestRepository.findByUserId(1L)).thenReturn(Optional.of(digest));
        when(digestRepository.save(any(Digest.class))).thenAnswer(inv -> inv.getArgument(0));

        Digest result = digestService.updateDigest(request);

        assertThat(result.getName()).isEqualTo("Updated Digest");
        assertThat(result.getFrequency()).isEqualTo("monthly");
        assertThat(result.getContentTypes()).containsExactly("news", "affirmations");
    }

    @Test
    void updateDigest_throwsNotFoundWhenNoneConfigured() {
        DigestUpdateRequest request = new DigestUpdateRequest();
        request.setName("X");
        request.setFrequency("daily");
        request.setDeliveryTime("morning");
        request.setContentTypes(new String[]{"tips"});

        when(userService.getCurrentUser()).thenReturn(user);
        when(digestRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> digestService.updateDigest(request))
                .isInstanceOf(DigestNotFoundException.class);
    }

    @Test
    void toggleDigest_flipsActiveStatus() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(digestRepository.findByUserId(1L)).thenReturn(Optional.of(digest));
        when(digestRepository.save(any(Digest.class))).thenAnswer(inv -> inv.getArgument(0));

        Digest result = digestService.toggleDigest();

        assertThat(result.isActive()).isTrue();
    }

    @Test
    void deleteDigest_deletesSuccessfully() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(digestRepository.findByUserId(1L)).thenReturn(Optional.of(digest));

        digestService.deleteDigest();

        verify(digestRepository).delete(digest);
    }

    @Test
    void deleteDigest_throwsNotFoundWhenNoneConfigured() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(digestRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> digestService.deleteDigest())
                .isInstanceOf(DigestNotFoundException.class);

        verify(digestRepository, never()).delete(any());
    }
}
