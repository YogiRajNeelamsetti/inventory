package com.kirana.controller;

import com.kirana.dto.ApiResponse;
import com.kirana.dto.PurchaseOrderDto;
import com.kirana.security.TenantContext;
import com.kirana.service.PurchaseOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPurchaseOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String dateFilter,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity.ok(ApiResponse
                .success(purchaseOrderService.getPurchaseOrders(retailerId, search, dateFilter, page, limit)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPurchaseOrderById(@PathVariable Long id,
            Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity.ok(ApiResponse
                .success(Map.of("purchase_order", purchaseOrderService.getPurchaseOrderById(id, retailerId))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createPurchaseOrder(
            @Valid @RequestBody PurchaseOrderDto dto, Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity.ok(
                ApiResponse.success(Map.of("purchase_order", purchaseOrderService.createPurchaseOrder(dto, retailerId)),
                        "Purchase order created"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateStatus(@PathVariable Long id,
            @RequestBody Map<String, String> body, Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity.ok(ApiResponse.success(Map.of("purchase_order",
                purchaseOrderService.updatePurchaseOrderStatus(id, body.get("status"), retailerId))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePurchaseOrder(@PathVariable Long id, Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        purchaseOrderService.deletePurchaseOrder(id, retailerId);
        return ResponseEntity.ok(ApiResponse.success(null, "Purchase order deleted"));
    }
}
