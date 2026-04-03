package com.kirana.repository;

import com.kirana.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findByRetailerIdAndDeletedAtIsNullOrderBySaleDateDesc(Long retailerId);

    Page<Sale> findByRetailerIdAndDeletedAtIsNullOrderBySaleDateDesc(Long retailerId, Pageable pageable);

    Optional<Sale> findByIdAndRetailerIdAndDeletedAtIsNull(Long id, Long retailerId);

    long countByRetailerIdAndDeletedAtIsNull(Long retailerId);

    @Query("SELECT COALESCE(SUM(s.finalAmount), 0) FROM Sale s WHERE s.retailerId = :retailerId AND s.deletedAt IS NULL AND s.saleDate BETWEEN :start AND :end")
    BigDecimal sumSalesByRetailerIdAndDateRange(@Param("retailerId") Long retailerId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.retailerId = :retailerId AND s.deletedAt IS NULL AND s.saleDate BETWEEN :start AND :end")
    long countSalesByRetailerIdAndDateRange(@Param("retailerId") Long retailerId, @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    List<Sale> findByRetailerIdAndDeletedAtIsNullAndSaleDateBetweenOrderBySaleDateDesc(Long retailerId,
            LocalDateTime start, LocalDateTime end);

    @Query("""
            SELECT s
            FROM Sale s
            WHERE s.retailerId = :retailerId
                AND s.deletedAt IS NULL
                AND s.saleDate >= :start
                AND s.saleDate <= :end
                AND (
                    LOWER(CONCAT('bill-', STR(s.id))) LIKE :searchPattern
                    OR EXISTS (
                        SELECT 1
                        FROM Customer c
                        WHERE c.id = s.customerId
                            AND c.retailerId = :retailerId
                            AND c.deletedAt IS NULL
                            AND LOWER(c.name) LIKE :searchPattern
                    )
                )
            ORDER BY s.saleDate DESC
            """)
    Page<Sale> findFilteredSales(
            @Param("retailerId") Long retailerId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("searchPattern") String searchPattern,
            Pageable pageable);

    @Query("""
            SELECT COALESCE(SUM(s.finalAmount), 0)
            FROM Sale s
            WHERE s.retailerId = :retailerId
                AND s.deletedAt IS NULL
                AND s.saleDate >= :start
                AND s.saleDate <= :end
                AND (
                    LOWER(CONCAT('bill-', STR(s.id))) LIKE :searchPattern
                    OR EXISTS (
                        SELECT 1
                        FROM Customer c
                        WHERE c.id = s.customerId
                            AND c.retailerId = :retailerId
                            AND c.deletedAt IS NULL
                            AND LOWER(c.name) LIKE :searchPattern
                    )
                )
            """)
    BigDecimal sumFilteredSales(
            @Param("retailerId") Long retailerId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("searchPattern") String searchPattern);

    @Query("""
            SELECT COUNT(s)
            FROM Sale s
            WHERE s.retailerId = :retailerId
                AND s.deletedAt IS NULL
                AND s.saleDate >= :start
                AND s.saleDate <= :end
                AND (
                    LOWER(CONCAT('bill-', STR(s.id))) LIKE :searchPattern
                    OR EXISTS (
                        SELECT 1
                        FROM Customer c
                        WHERE c.id = s.customerId
                            AND c.retailerId = :retailerId
                            AND c.deletedAt IS NULL
                            AND LOWER(c.name) LIKE :searchPattern
                    )
                )
            """)
    long countFilteredSales(
            @Param("retailerId") Long retailerId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("searchPattern") String searchPattern);

    @Query("""
            SELECT COALESCE(SUM(s.finalAmount), 0)
            FROM Sale s
            WHERE s.retailerId = :retailerId
              AND s.saleDate BETWEEN :start AND :end
              AND LOWER(s.paymentMethod) = LOWER(:paymentMethod)
              AND s.deletedAt IS NULL
            """)
    BigDecimal sumSalesByRetailerIdAndDateRangeAndPaymentMethod(
            @Param("retailerId") Long retailerId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("paymentMethod") String paymentMethod);

    @Query("""
            SELECT COALESCE(SUM(s.finalAmount - s.paidAmount), 0)
            FROM Sale s
            WHERE s.retailerId = :retailerId
              AND s.paymentStatus IN ('pending', 'partial')
              AND s.deletedAt IS NULL
            """)
    BigDecimal sumPendingCustomerPaymentsByRetailerId(
            @Param("retailerId") Long retailerId);

}
