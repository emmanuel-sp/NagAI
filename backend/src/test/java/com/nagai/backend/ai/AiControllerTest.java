package com.nagai.backend.ai;

import com.nagai.backend.exceptions.AiServiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiControllerTest {

    @Mock
    private AiGrpcClientService aiGrpcClientService;

    private AiController controller;

    @BeforeEach
    void setUp() {
        controller = new AiController(aiGrpcClientService);
    }

    @Test
    void suggestSmartField_returnsOkWithSuggestion() {
        when(aiGrpcClientService.suggestSmartField("measurable", "Run a marathon", "Complete 26.2 miles",
                Map.of("specific", "Complete the NYC Marathon 2026")))
                .thenReturn("Log weekly mileage and finish a sub-4-hour marathon by December");

        ResponseEntity<SmartGoalSuggestionResponse> response = controller.suggestSmartField(
                new SmartGoalSuggestionRequest("measurable", "Run a marathon", "Complete 26.2 miles",
                        Map.of("specific", "Complete the NYC Marathon 2026")));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().suggestion())
                .isEqualTo("Log weekly mileage and finish a sub-4-hour marathon by December");
    }

    @Test
    void suggestSmartField_propagatesAiServiceException() {
        when(aiGrpcClientService.suggestSmartField(any(), any(), any(), any()))
                .thenThrow(new AiServiceException("AI service unavailable: Connection refused"));

        assertThatThrownBy(() -> controller.suggestSmartField(
                new SmartGoalSuggestionRequest("specific", "Get fit", "Exercise regularly", null)))
                .isInstanceOf(AiServiceException.class)
                .hasMessageContaining("Connection refused");
    }
}
