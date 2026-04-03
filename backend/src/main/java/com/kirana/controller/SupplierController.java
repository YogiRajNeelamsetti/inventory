package com.kirana.controller;

import com.kirana.dto.ApiResponse;
import com.kirana.dto.SupplierDto;
import com.kirana.security.TenantContext;
import com.kirana.service.PurchaseOrderService;
import com.kirana.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;
    private final PurchaseOrderService purchaseOrderService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSuppliers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int limit,
            Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity.ok(ApiResponse.success(supplierService.getSuppliers(retailerId, page, limit)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupplierById(@PathVariable Long id,
            Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity
                .ok(ApiResponse.success(Map.of("supplier", supplierService.getSupplierById(id, retailerId))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> addSupplier(@Valid @RequestBody SupplierDto dto,
            Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity.ok(ApiResponse.success(Map.of("supplier", supplierService.addSupplier(dto, retailerId)),
                "Supplier added successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSupplier(@PathVariable Long id,
            @Valid @RequestBody SupplierDto dto, Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity
                .ok(ApiResponse.success(Map.of("supplier", supplierService.updateSupplier(id, dto, retailerId)),
                        "Supplier updated successfully"));
    }

    @GetMapping("/{id}/purchase-orders")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSupplierPurchaseOrders(@PathVariable Long id,
            Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity.ok(ApiResponse
                .success(Map.of("purchase_orders", purchaseOrderService.getPurchaseOrdersBySupplier(id, retailerId))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSupplier(@PathVariable Long id, Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        supplierService.deleteSupplier(id, retailerId);
        return ResponseEntity.ok(ApiResponse.success(null, "Supplier deleted successfully"));
    }
}
