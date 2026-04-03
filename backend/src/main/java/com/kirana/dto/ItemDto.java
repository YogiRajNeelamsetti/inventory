package com.kirana.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ItemDto {
    private Long id;

    @NotBlank(message = "Item name is required")
    private String name;

    private String description;
    private String sku;
    private String barcode;
    private String category;
    private String unit;

    @NotNull(message = "Purchase price is required")
    private BigDecimal purchasePrice;

    @NotNull(message = "Selling price is required")
    private BigDecimal sellingPrice;

    private BigDecimal currentStock;
    private BigDecimal minStockThreshold;
    private BigDecimal reorderPoint;
    private BigDecimal maxStockLevel;
    private Boolean isAvailable;
    private Boolean isLowStock;
    private String lastPurchaseDate;
    private String lastSaleDate;
}
