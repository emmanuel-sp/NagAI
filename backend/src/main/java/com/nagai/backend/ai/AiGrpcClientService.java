package com.nagai.backend.ai;

import com.nagai.ai.AiServiceGrpc;
import com.nagai.ai.ChecklistItemRequest;
import com.nagai.ai.ChecklistItemResponse;
import com.nagai.ai.FullChecklistRequest;
import com.nagai.ai.FullChecklistResponse;
import com.nagai.ai.SmartFieldRequest;
import com.nagai.backend.exceptions.AiServiceException;
import io.grpc.ClientInterceptor;
import io.grpc.ManagedChannel;
import io.grpc.Metadata;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.MetadataUtils;
import io.micrometer.core.instrument.Counter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.grpc.client.GrpcChannelFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AiGrpcClientService {

    private static final Logger log = LoggerFactory.getLogger(AiGrpcClientService.class);

    private final AiServiceGrpc.AiServiceBlockingStub stub;
    private final Counter grpcErrorsCounter;

    // Primary constructor — used by Spring
    @Autowired
    public AiGrpcClientService(GrpcChannelFactory channelFactory, Counter grpcErrorsCounter) {
        ManagedChannel channel = channelFactory.createChannel("ai-service");
        this.stub = AiServiceGrpc.newBlockingStub(channel);
        this.grpcErrorsCounter = grpcErrorsCounter;
    }

    // Test constructor — package-private, avoids mocking GrpcChannelFactory
    AiGrpcClientService(AiServiceGrpc.AiServiceBlockingStub stub) {
        this.stub = stub;
        this.grpcErrorsCounter = null;
    }

    private AiServiceGrpc.AiServiceBlockingStub stubWithCorrelation() {
        String correlationId = MDC.get("correlationId");
        if (correlationId != null) {
            Metadata metadata = new Metadata();
            metadata.put(
                    Metadata.Key.of("x-correlation-id", Metadata.ASCII_STRING_MARSHALLER),
                    correlationId);
            ClientInterceptor interceptor = MetadataUtils.newAttachHeadersInterceptor(metadata);
            return stub.withInterceptors(interceptor);
        }
        return stub;
    }

    public String suggestSmartField(String field, String goalTitle, String goalDescription,
                                    Map<String, String> existingFields, String userProfile,
                                    String stepsTaken, String targetDate) {
        try {
            SmartFieldRequest.Builder builder = SmartFieldRequest.newBuilder()
                    .setField(field)
                    .setGoalTitle(goalTitle)
                    .setGoalDescription(goalDescription)
                    .putAllExistingFields(existingFields)
                    .setUserProfile(userProfile);
            if (stepsTaken != null && !stepsTaken.isBlank()) {
                builder.setStepsTaken(stepsTaken);
            }
            if (targetDate != null && !targetDate.isBlank()) {
                builder.setTargetDate(targetDate);
            }
            return stubWithCorrelation().suggestSmartField(builder.build()).getSuggestion();
        } catch (StatusRuntimeException e) {
            if (grpcErrorsCounter != null) grpcErrorsCounter.increment();
            log.error("gRPC call failed: {}", e.getStatus().getDescription());
            throw new AiServiceException("AI service unavailable: " + e.getStatus().getDescription(), e);
        }
    }

    public ChecklistItemResponse generateChecklistItem(
            String goalTitle, String goalDescription,
            List<String> activeItems, List<String> completedItems,
            String goalSmartContext, String userProfile) {
        try {
            return stubWithCorrelation().generateChecklistItem(ChecklistItemRequest.newBuilder()
                    .setGoalTitle(goalTitle)
                    .setGoalDescription(goalDescription)
                    .addAllExistingItems(activeItems)
                    .setUserProfile(userProfile)
                    .addAllCompletedItems(completedItems)
                    .setGoalSmartContext(goalSmartContext)
                    .build());
        } catch (StatusRuntimeException e) {
            if (grpcErrorsCounter != null) grpcErrorsCounter.increment();
            log.error("gRPC call failed: {}", e.getStatus().getDescription());
            throw new AiServiceException("AI service unavailable: " + e.getStatus().getDescription(), e);
        }
    }

    public FullChecklistResponse generateFullChecklist(
            String goalTitle, String goalDescription,
            List<String> completedItems, String goalSmartContext, String userProfile) {
        try {
            return stubWithCorrelation().generateFullChecklist(FullChecklistRequest.newBuilder()
                    .setGoalTitle(goalTitle)
                    .setGoalDescription(goalDescription)
                    .setUserProfile(userProfile)
                    .addAllCompletedItems(completedItems)
                    .setGoalSmartContext(goalSmartContext)
                    .build());
        } catch (StatusRuntimeException e) {
            if (grpcErrorsCounter != null) grpcErrorsCounter.increment();
            log.error("gRPC call failed: {}", e.getStatus().getDescription());
            throw new AiServiceException("AI service unavailable: " + e.getStatus().getDescription(), e);
        }
    }
}
