package com.kirana.controller;

import com.kirana.dto.ApiResponse;
import com.kirana.security.TenantContext;
import com.kirana.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummaryReport(Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity.ok(ApiResponse.success(reportService.getSummaryReport(retailerId)));
    }

    @GetMapping("/top-items")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTopItems(Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity.ok(ApiResponse.success(Map.of("top_items", reportService.getTopItems(retailerId))));
    }
}
