package com.nagai.backend.ai;

import com.nagai.ai.AgentChatRequest;
import com.nagai.ai.AgentChatResponse;
import com.nagai.ai.AiServiceGrpc;
import com.nagai.ai.ChatGoalSummary;
import com.nagai.ai.ChatHistoryEntry;
import com.nagai.ai.ChecklistItemRequest;
import com.nagai.ai.ChecklistItemResponse;
import com.nagai.ai.CalendarBusyBlock;
import com.nagai.ai.DailyChecklistCandidate;
import com.nagai.ai.DailyChecklistRequest;
import com.nagai.ai.DailyChecklistResponse;
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

    interface AiBlockingClient {
        com.nagai.ai.SmartFieldResponse suggestSmartField(SmartFieldRequest request);
        ChecklistItemResponse generateChecklistItem(ChecklistItemRequest request);
        FullChecklistResponse generateFullChecklist(FullChecklistRequest request);
        DailyChecklistResponse generateDailyChecklist(DailyChecklistRequest request);
        AgentChatResponse agentChat(AgentChatRequest request);
    }

    private static final Logger log = LoggerFactory.getLogger(AiGrpcClientService.class);

    private final AiServiceGrpc.AiServiceBlockingStub stub;
    private final AiBlockingClient blockingClient;
    private final Counter grpcErrorsCounter;

    // Primary constructor — used by Spring
    @Autowired
    public AiGrpcClientService(GrpcChannelFactory channelFactory, Counter grpcErrorsCounter) {
        ManagedChannel channel = channelFactory.createChannel("ai-service");
        this.stub = AiServiceGrpc.newBlockingStub(channel);
        this.blockingClient = null;
        this.grpcErrorsCounter = grpcErrorsCounter;
    }

    // Test constructor — package-private, avoids mocking GrpcChannelFactory
    AiGrpcClientService(AiBlockingClient blockingClient) {
        this.stub = null;
        this.blockingClient = blockingClient;
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
            SmartFieldRequest request = builder.build();
            if (blockingClient != null) {
                return blockingClient.suggestSmartField(request).getSuggestion();
            }
            return stubWithCorrelation().suggestSmartField(request).getSuggestion();
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
            ChecklistItemRequest request = ChecklistItemRequest.newBuilder()
                    .setGoalTitle(goalTitle)
                    .setGoalDescription(goalDescription)
                    .addAllExistingItems(activeItems)
                    .setUserProfile(userProfile)
                    .addAllCompletedItems(completedItems)
                    .setGoalSmartContext(goalSmartContext)
                    .build();
            if (blockingClient != null) {
                return blockingClient.generateChecklistItem(request);
            }
            return stubWithCorrelation().generateChecklistItem(request);
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
            FullChecklistRequest request = FullChecklistRequest.newBuilder()
                    .setGoalTitle(goalTitle)
                    .setGoalDescription(goalDescription)
                    .setUserProfile(userProfile)
                    .addAllCompletedItems(completedItems)
                    .setGoalSmartContext(goalSmartContext)
                    .build();
            if (blockingClient != null) {
                return blockingClient.generateFullChecklist(request);
            }
            return stubWithCorrelation().generateFullChecklist(request);
        } catch (StatusRuntimeException e) {
            if (grpcErrorsCounter != null) grpcErrorsCounter.increment();
            log.error("gRPC call failed: {}", e.getStatus().getDescription());
            throw new AiServiceException("AI service unavailable: " + e.getStatus().getDescription(), e);
        }
    }

    public DailyChecklistResponse generateDailyChecklist(
            List<DailyChecklistCandidate> candidates, List<String> recurringItems,
            int maxItems, String currentTime, String userProfile,
            String dayOfWeek, String planDate, List<CalendarBusyBlock> busyBlocks) {
        try {
            DailyChecklistRequest.Builder req = DailyChecklistRequest.newBuilder()
                    .addAllCandidates(candidates)
                    .addAllRecurringItems(recurringItems)
                    .setMaxItems(maxItems)
                    .setCurrentTime(currentTime)
                    .setUserProfile(userProfile)
                    .setDayOfWeek(dayOfWeek)
                    .setPlanDate(planDate);
            if (busyBlocks != null && !busyBlocks.isEmpty()) {
                req.addAllBusyBlocks(busyBlocks);
            }
            DailyChecklistRequest request = req.build();
            if (blockingClient != null) {
                return blockingClient.generateDailyChecklist(request);
            }
            return stubWithCorrelation().generateDailyChecklist(request);
        } catch (StatusRuntimeException e) {
            if (grpcErrorsCounter != null) grpcErrorsCounter.increment();
            log.error("gRPC call failed: {}", e.getStatus().getDescription());
            throw new AiServiceException("AI service unavailable: " + e.getStatus().getDescription(), e);
        }
    }

    public AgentChatResponse agentChat(String userMessage, String userProfile,
                                        List<ChatGoalSummary> goals,
                                        List<ChatHistoryEntry> history,
                                        String fromContextSummary,
                                        Long userId) {
        try {
            AgentChatRequest.Builder builder = AgentChatRequest.newBuilder()
                    .setUserMessage(userMessage)
                    .setUserProfile(userProfile)
                    .addAllGoals(goals)
                    .addAllHistory(history);
            if (fromContextSummary != null && !fromContextSummary.isBlank()) {
                builder.setFromContextSummary(fromContextSummary);
            }
            if (userId != null) {
                builder.setUserId(userId);
            }
            AgentChatRequest request = builder.build();
            if (blockingClient != null) {
                return blockingClient.agentChat(request);
            }
            return stubWithCorrelation()
                    .withDeadlineAfter(30, java.util.concurrent.TimeUnit.SECONDS)
                    .agentChat(request);
        } catch (StatusRuntimeException e) {
            if (grpcErrorsCounter != null) grpcErrorsCounter.increment();
            log.error("gRPC call failed: {}", e.getStatus().getDescription());
            throw new AiServiceException("AI service unavailable: " + e.getStatus().getDescription(), e);
        }
    }
}
