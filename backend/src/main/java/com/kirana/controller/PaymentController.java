package com.kirana.controller;

import com.kirana.dto.ApiResponse;
import com.kirana.dto.PaymentDto;
import com.kirana.security.TenantContext;
import com.kirana.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/suppliers/{supplierId}/payments")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupplierPayments(
            @PathVariable Long supplierId, Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity.ok(ApiResponse.success(Map.of("payments", paymentService.getSupplierPayments(supplierId, retailerId))));
    }

    @PostMapping("/payments/supplier")
    public ResponseEntity<ApiResponse<Map<String, Object>>> recordPayment(@Valid @RequestBody PaymentDto dto, Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity.ok(ApiResponse.success(Map.of("payment", paymentService.recordSupplierPayment(dto, retailerId)), "Payment recorded"));
    }

    @GetMapping("/payments/supplier/pending")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPendingPayments(Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity.ok(ApiResponse.success(Map.of("pending_payments", paymentService.getPendingSupplierPayments(retailerId))));
    }
}
