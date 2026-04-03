package com.kirana.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "retailer_id", nullable = false)
    private Long retailerId;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(length = 100)
    private String sku;

    @Column(length = 100)
    private String barcode;

    @Column(length = 100)
    private String category;

    @Column(length = 50)
    private String unit;

    @Column(name = "purchase_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "selling_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal sellingPrice;

    @Column(name = "current_stock", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal currentStock = BigDecimal.ZERO;

    @Column(name = "min_stock_threshold", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal minStockThreshold = BigDecimal.ZERO;

    @Column(name = "reorder_point", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal reorderPoint = BigDecimal.ZERO;

    @Column(name = "max_stock_level", precision = 10, scale = 2)
    private BigDecimal maxStockLevel;

    @Column(name = "last_purchase_date")
    private LocalDateTime lastPurchaseDate;

    @Column(name = "last_sale_date")
    private LocalDateTime lastSaleDate;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
