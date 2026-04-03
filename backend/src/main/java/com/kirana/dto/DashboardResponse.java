package com.kirana.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DashboardResponse {
    private TodaySummary today;
    private MonthSummary thisMonth;
    private InventorySummary inventory;
    private PaymentsSummary payments;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TodaySummary {
        private BigDecimal sales;
        private long bills;
        private BigDecimal profit;
        private BigDecimal cashSales;
        private BigDecimal digitalSales;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MonthSummary {
        private BigDecimal sales;
        private BigDecimal purchases;
        private BigDecimal profit;
        private long bills;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class InventorySummary {
        private long totalItems;
        private long lowStockItems;
        private long outOfStockItems;
        private BigDecimal totalStockValue;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PaymentsSummary {
        private BigDecimal pendingSupplierPayments;
        private BigDecimal pendingCustomerPayments;
    }
}
