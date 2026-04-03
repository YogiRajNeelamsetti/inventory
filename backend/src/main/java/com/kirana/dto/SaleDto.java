package com.kirana.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleDto {
    private Long id;
    private String billNumber;
    private Long customerId;
    private String customerName;
    private String saleDate;

    @NotNull(message = "Total amount is required")
    private BigDecimal totalAmount;

    private BigDecimal discount;

    @NotNull(message = "Final amount is required")
    private BigDecimal finalAmount;

    private String paymentMethod;
    private String paymentStatus;
    private BigDecimal paidAmount;
    private Integer itemsCount;
    private String notes;

    @NotEmpty(message = "Sale must contain at least one item")
    @Valid
    private List<SaleItemDto> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaleItemDto {
        @NotNull(message = "Item ID is required")
        private Long itemId;

        private String itemName;

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be positive")
        private BigDecimal quantity;

        @NotNull(message = "Unit price is required")
        @Positive(message = "Unit price must be positive")
        private BigDecimal unitPrice;

        // private BigDecimal total;
        private BigDecimal unitCostPrice;
    }
}
