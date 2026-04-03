package com.kirana.controller;

import com.kirana.dto.ApiResponse;
import com.kirana.dto.SaleDto;
import com.kirana.security.TenantContext;
import com.kirana.service.SaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSales(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String dateFilter,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity
                .ok(ApiResponse.success(saleService.getSales(retailerId, search, dateFilter, page, limit)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSaleById(@PathVariable Long id, Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity.ok(ApiResponse.success(Map.of("sale", saleService.getSaleById(id, retailerId))));
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSaleDetails(@PathVariable Long id, Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity.ok(ApiResponse.success(saleService.getSaleDetails(id, retailerId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createSale(@Valid @RequestBody SaleDto dto,
            Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity
                .ok(ApiResponse.success(Map.of("sale", saleService.createSale(dto, retailerId)), "Sale created"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSale(@PathVariable Long id, Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        saleService.deleteSale(id, retailerId);
        return ResponseEntity.ok(ApiResponse.success(null, "Sale deleted"));
    }
}
