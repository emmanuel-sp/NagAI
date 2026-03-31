package com.nagai.backend.dailychecklist;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/daily-checklists")
public class DailyChecklistController {

    private final DailyChecklistService dailyChecklistService;

    public DailyChecklistController(DailyChecklistService dailyChecklistService) {
        this.dailyChecklistService = dailyChecklistService;
    }

    @GetMapping("/today")
    public ResponseEntity<DailyChecklistResponse> getTodayChecklist() {
        DailyChecklistResponse response = dailyChecklistService.getTodayChecklist();
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/generate")
    public ResponseEntity<DailyChecklistResponse> generateDailyChecklist() {
        boolean created = dailyChecklistService.getTodayChecklist() == null;
        DailyChecklistResponse response = dailyChecklistService.generateDailyChecklist();
        return ResponseEntity.status(created ? HttpStatus.CREATED : HttpStatus.OK).body(response);
    }

    @GetMapping("/config")
    public ResponseEntity<DailyChecklistConfigResponse> getConfig() {
        return ResponseEntity.ok(dailyChecklistService.getConfig());
    }

    @PutMapping("/config")
    public ResponseEntity<DailyChecklistConfigResponse> updateConfig(
            @Valid @RequestBody DailyChecklistConfigRequest request) {
        return ResponseEntity.ok(dailyChecklistService.updateConfig(request));
    }

    @PatchMapping("/items/{dailyItemId}/toggle")
    public ResponseEntity<DailyChecklistItemResponse> toggleItem(
            @PathVariable Long dailyItemId) {
        return ResponseEntity.ok(dailyChecklistService.toggleDailyItem(dailyItemId));
    }

    @PostMapping("/items")
    public ResponseEntity<DailyChecklistItemResponse> addItem(
            @Valid @RequestBody DailyChecklistItemCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dailyChecklistService.addDailyItem(request));
    }

    @PatchMapping("/items/{dailyItemId}")
    public ResponseEntity<DailyChecklistItemResponse> updateItem(
            @PathVariable Long dailyItemId,
            @Valid @RequestBody DailyChecklistItemUpdateRequest request) {
        return ResponseEntity.ok(dailyChecklistService.updateDailyItem(dailyItemId, request));
    }

    @PatchMapping("/today/reorder")
    public ResponseEntity<DailyChecklistResponse> reorderTodayItems(
            @Valid @RequestBody DailyChecklistReorderRequest request) {
        return ResponseEntity.ok(dailyChecklistService.reorderTodayItems(request));
    }

    @DeleteMapping("/items/{dailyItemId}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long dailyItemId) {
        dailyChecklistService.deleteDailyItem(dailyItemId);
        return ResponseEntity.noContent().build();
    }
}
