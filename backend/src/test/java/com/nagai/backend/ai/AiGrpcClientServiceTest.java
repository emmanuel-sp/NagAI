package com.nagai.backend.ai;

import com.nagai.ai.AiServiceGrpc;
import com.nagai.ai.ChecklistItem;
import com.nagai.ai.ChecklistItemResponse;
import com.nagai.ai.FullChecklistResponse;
import com.nagai.ai.SmartFieldResponse;
import com.nagai.backend.exceptions.AiServiceException;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiGrpcClientServiceTest {

    @Mock
    private AiServiceGrpc.AiServiceBlockingStub mockStub;

    private AiGrpcClientService service;

    @BeforeEach
    void setUp() {
        service = new AiGrpcClientService(mockStub);
    }

    @Test
    void suggestSmartField_returnsExpectedSuggestion() {
        when(mockStub.suggestSmartField(any())).thenReturn(
                SmartFieldResponse.newBuilder().setSuggestion("Track 3 workouts per week").build());

        String result = service.suggestSmartField("measurable", "Get fit", "Exercise regularly",
                Map.of("specific", "Go to the gym 4x per week"));

        assertThat(result).isEqualTo("Track 3 workouts per week");
    }

    @Test
    void generateChecklistItem_returnsItemWithAllFields() {
        when(mockStub.generateChecklistItem(any())).thenReturn(
                ChecklistItemResponse.newBuilder()
                        .setTitle("Sign up for gym")
                        .setNotes("Choose nearby")
                        .setDeadline("2026-04-01")
                        .build());

        ChecklistItemResponse result = service.generateChecklistItem(
                "Get fit", "Exercise regularly", List.of("Buy running shoes"));

        assertThat(result.getTitle()).isEqualTo("Sign up for gym");
        assertThat(result.getDeadline()).isEqualTo("2026-04-01");
    }

    @Test
    void generateFullChecklist_returnsItemList() {
        when(mockStub.generateFullChecklist(any())).thenReturn(
                FullChecklistResponse.newBuilder()
                        .addItems(ChecklistItem.newBuilder().setTitle("Start jogging").build())
                        .build());

        FullChecklistResponse result = service.generateFullChecklist("Get fit", "Exercise");

        assertThat(result.getItemsList()).hasSize(1);
        assertThat(result.getItems(0).getTitle()).isEqualTo("Start jogging");
    }

    @Test
    void whenGrpcUnavailable_throwsAiServiceException() {
        when(mockStub.suggestSmartField(any()))
                .thenThrow(new StatusRuntimeException(
                        Status.UNAVAILABLE.withDescription("Connection refused")));

        assertThatThrownBy(() -> service.suggestSmartField("specific", "Get fit", "Exercise", Map.of()))
                .isInstanceOf(AiServiceException.class)
                .hasMessageContaining("Connection refused");
    }
}
