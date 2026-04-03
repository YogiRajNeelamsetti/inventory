package com.kirana.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PurchaseOrderDto {
    private Long id;

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    private String supplierName;
    private String orderDate;
    private String status;

    @NotNull(message = "Total amount is required")
    @Positive(message = "Total amount must be positive")
    private BigDecimal totalAmount;

    private String paymentStatus;
    private BigDecimal paidAmount;
    private BigDecimal pendingAmount;
    private Integer itemsCount;
    private String notes;

    @Valid
    private List<PurchaseOrderItemDto> items;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PurchaseOrderItemDto {
        @NotNull(message = "Item ID is required")
        private Long itemId;

        private String itemName;

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be positive")
        private BigDecimal quantity;

        @NotNull(message = "Unit price is required")
        @Positive(message = "Unit price must be positive")
        private BigDecimal unitPrice;

        private BigDecimal amount;
    }
}
