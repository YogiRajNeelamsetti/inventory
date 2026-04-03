package com.kirana.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PaymentDto {
    private Long id;

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    private String supplierName;
    private Long purchaseOrderId;
    private Long orderId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    private BigDecimal pendingAmount;
    private String date;
    private String method;
    private String referenceNumber;
    private String notes;
}
