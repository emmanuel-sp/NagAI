package com.nagai.backend.digests;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.nagai.backend.common.TokenHashService;
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

    @Mock
    private TokenHashService tokenHashService;

    @InjectMocks
    private DigestService digestService;

    private User user;
    private Digest digest;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUserId(1L);
        user.setEmail("test@example.com");
        user.setTimezone("America/New_York");

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
        when(tokenHashService.hash(anyString())).thenReturn("digest-hash");
        when(digestRepository.save(any(Digest.class))).thenAnswer(inv -> inv.getArgument(0));

        Digest result = digestService.createDigest(request);

        assertThat(result.getUserId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("New Digest");
        assertThat(result.getFrequency()).isEqualTo("weekly");
        assertThat(result.getUnsubscribeTokenHash()).isEqualTo("digest-hash");
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
    void toggleDigest_flipsActiveAndSetsNextDelivery() {
        when(userService.getCurrentUser()).thenReturn(user);
        when(digestRepository.findByUserId(1L)).thenReturn(Optional.of(digest));
        when(digestRepository.save(any(Digest.class))).thenAnswer(inv -> inv.getArgument(0));

        Digest result = digestService.toggleDigest();

        assertThat(result.isActive()).isTrue();
        assertThat(result.getNextDeliveryAt()).isNotNull();
    }

    @Test
    void toggleDigest_clearsNextDeliveryWhenTogglingOff() {
        digest.setActive(true);
        digest.setNextDeliveryAt(LocalDateTime.now());
        digest.setProcessingStartedAt(LocalDateTime.now());

        when(userService.getCurrentUser()).thenReturn(user);
        when(digestRepository.findByUserId(1L)).thenReturn(Optional.of(digest));
        when(digestRepository.save(any(Digest.class))).thenAnswer(inv -> inv.getArgument(0));

        Digest result = digestService.toggleDigest();

        assertThat(result.isActive()).isFalse();
        assertThat(result.getNextDeliveryAt()).isNull();
        assertThat(result.getProcessingStartedAt()).isNull();
    }

    @Test
    void unsubscribeByToken_supportsLegacyPlaintextTokenFallback() {
        digest.setActive(true);
        digest.setProcessingStartedAt(LocalDateTime.now());

        when(tokenHashService.hash("legacy-token")).thenReturn("digest-hash");
        when(digestRepository.findByUnsubscribeTokenHash("digest-hash")).thenReturn(Optional.empty());
        when(digestRepository.findByUnsubscribeToken("legacy-token")).thenReturn(Optional.of(digest));
        when(digestRepository.save(any(Digest.class))).thenAnswer(inv -> inv.getArgument(0));

        digestService.unsubscribeByToken("legacy-token");

        assertThat(digest.isActive()).isFalse();
        assertThat(digest.getNextDeliveryAt()).isNull();
        assertThat(digest.getProcessingStartedAt()).isNull();
        assertThat(digest.getUnsubscribeTokenHash()).isEqualTo("digest-hash");
        verify(digestRepository).save(digest);
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

    @Test
    void calculateNextDelivery_dailyMorningUTC() {
        LocalDateTime result = digestService.calculateNextDelivery("daily", "morning", ZoneOffset.UTC);
        assertThat(result).isNotNull();
        assertThat(result.getHour()).isEqualTo(8);
        assertThat(result).isAfter(LocalDateTime.now(ZoneOffset.UTC));
    }

    @Test
    void calculateNextDelivery_weeklyAfternoon() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime result = digestService.calculateNextDelivery("weekly", "afternoon", ZoneOffset.UTC);
        assertThat(result).isAfter(now.plusDays(6));
    }

    @Test
    void calculateNextDelivery_respectsTimezone() {
        ZoneId nyZone = ZoneId.of("America/New_York");
        LocalDateTime result = digestService.calculateNextDelivery("daily", "morning", nyZone);
        // Morning in NY (8 AM ET) should be 13:00 UTC (EST) or 12:00 UTC (EDT)
        assertThat(result.getHour()).isIn(12, 13);
    }

    @Test
    void mapDeliveryHour_allValues() {
        assertThat(DigestService.mapDeliveryHour("morning")).isEqualTo(8);
        assertThat(DigestService.mapDeliveryHour("afternoon")).isEqualTo(13);
        assertThat(DigestService.mapDeliveryHour("evening")).isEqualTo(19);
        assertThat(DigestService.mapDeliveryHour("unknown")).isEqualTo(8);
    }

    @Test
    void resolveZone_validTimezone() {
        assertThat(DigestService.resolveZone("America/New_York")).isEqualTo(ZoneId.of("America/New_York"));
    }

    @Test
    void resolveZone_invalidFallsBackToUTC() {
        assertThat(DigestService.resolveZone("Invalid/Zone")).isEqualTo(ZoneOffset.UTC);
        assertThat(DigestService.resolveZone(null)).isEqualTo(ZoneOffset.UTC);
        assertThat(DigestService.resolveZone("")).isEqualTo(ZoneOffset.UTC);
    }

    @Test
    void markDelivered_updatesTimestamps() {
        digest.setFrequency("daily");
        digest.setDeliveryTime("morning");

        when(digestRepository.save(any(Digest.class))).thenAnswer(inv -> inv.getArgument(0));

        digestService.markDelivered(digest, user);

        assertThat(digest.getLastDeliveredAt()).isNotNull();
        assertThat(digest.getNextDeliveryAt()).isNotNull();
        assertThat(digest.getNextDeliveryAt()).isAfter(digest.getLastDeliveredAt());
        verify(digestRepository).save(digest);
    }
}
