package com.kirana.controller;

import com.kirana.dto.ApiResponse;
import com.kirana.dto.CategoryRequest;
import com.kirana.security.TenantContext;
import com.kirana.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCategories(Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        return ResponseEntity.ok(ApiResponse.success(Map.of("categories", categoryService.getCategories(retailerId))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> addCategory(@Valid @RequestBody CategoryRequest request,
            Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        categoryService.addCategory(request.getName(), retailerId);
        return ResponseEntity.ok(ApiResponse.success(null, "Category added successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> updateCategory(@PathVariable Long id,
            @Valid @RequestBody CategoryRequest request, Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        categoryService.updateCategory(id, request.getName(), retailerId);
        return ResponseEntity.ok(ApiResponse.success(null, "Category updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id, Authentication auth) {
        Long retailerId = TenantContext.getRetailerId(auth);
        categoryService.deleteCategory(id, retailerId);
        return ResponseEntity.ok(ApiResponse.success(null, "Category deleted successfully"));
    }
}
