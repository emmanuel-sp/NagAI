package com.nagai.backend.ai;

import com.nagai.ai.AiServiceGrpc;
import com.nagai.ai.ChecklistItemRequest;
import com.nagai.ai.ChecklistItemResponse;
import com.nagai.ai.FullChecklistRequest;
import com.nagai.ai.FullChecklistResponse;
import com.nagai.ai.SmartFieldRequest;
import com.nagai.backend.exceptions.AiServiceException;
import io.grpc.ManagedChannel;
import io.grpc.StatusRuntimeException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.grpc.client.GrpcChannelFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AiGrpcClientService {

    private final AiServiceGrpc.AiServiceBlockingStub stub;

    // Primary constructor — used by Spring
    @Autowired
    public AiGrpcClientService(GrpcChannelFactory channelFactory) {
        ManagedChannel channel = channelFactory.createChannel("ai-service");
        this.stub = AiServiceGrpc.newBlockingStub(channel);
    }

    // Test constructor — package-private, avoids mocking GrpcChannelFactory
    AiGrpcClientService(AiServiceGrpc.AiServiceBlockingStub stub) {
        this.stub = stub;
    }

    public String suggestSmartField(String field, String goalTitle, String goalDescription,
                                    Map<String, String> existingFields) {
        try {
            return stub.suggestSmartField(SmartFieldRequest.newBuilder()
                    .setField(field)
                    .setGoalTitle(goalTitle)
                    .setGoalDescription(goalDescription)
                    .putAllExistingFields(existingFields)
                    .build()).getSuggestion();
        } catch (StatusRuntimeException e) {
            throw new AiServiceException("AI service unavailable: " + e.getStatus().getDescription(), e);
        }
    }

    public ChecklistItemResponse generateChecklistItem(
            String goalTitle, String goalDescription, List<String> existingItems) {
        try {
            return stub.generateChecklistItem(ChecklistItemRequest.newBuilder()
                    .setGoalTitle(goalTitle)
                    .setGoalDescription(goalDescription)
                    .addAllExistingItems(existingItems)
                    .build());
        } catch (StatusRuntimeException e) {
            throw new AiServiceException("AI service unavailable: " + e.getStatus().getDescription(), e);
        }
    }

    public FullChecklistResponse generateFullChecklist(String goalTitle, String goalDescription) {
        try {
            return stub.generateFullChecklist(FullChecklistRequest.newBuilder()
                    .setGoalTitle(goalTitle)
                    .setGoalDescription(goalDescription)
                    .build());
        } catch (StatusRuntimeException e) {
            throw new AiServiceException("AI service unavailable: " + e.getStatus().getDescription(), e);
        }
    }
}
