package com.kirana.repository;

import com.kirana.entity.PurchaseOrder;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
        List<PurchaseOrder> findByRetailerIdAndDeletedAtIsNullOrderByOrderDateDesc(Long retailerId);

        Page<PurchaseOrder> findByRetailerIdAndDeletedAtIsNullOrderByOrderDateDesc(Long retailerId, Pageable pageable);

        Optional<PurchaseOrder> findByIdAndRetailerIdAndDeletedAtIsNull(Long id, Long retailerId);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT po FROM PurchaseOrder po WHERE po.id = :id AND po.retailerId = :retailerId AND po.deletedAt IS NULL")
        Optional<PurchaseOrder> findByIdAndRetailerIdAndDeletedAtIsNullForUpdate(@Param("id") Long id,
                        @Param("retailerId") Long retailerId);

        List<PurchaseOrder> findByRetailerIdAndStatusAndDeletedAtIsNull(Long retailerId, String status);

        List<PurchaseOrder> findByRetailerIdAndSupplierIdAndDeletedAtIsNullOrderByOrderDateDesc(Long retailerId,
                        Long supplierId);

        @Query("""
                        SELECT po
                        FROM PurchaseOrder po
                        WHERE po.retailerId = :retailerId
                                AND po.deletedAt IS NULL
                                AND po.orderDate >= :start
                                AND po.orderDate <= :end
                                AND (
                                        LOWER(CONCAT('po-', STR(po.id))) LIKE :searchPattern
                                        OR EXISTS (
                                                        SELECT 1
                                                        FROM Supplier s
                                                        WHERE s.id = po.supplierId
                                                                AND s.retailerId = :retailerId
                                                                AND s.deletedAt IS NULL
                                                                AND LOWER(s.companyName) LIKE :searchPattern
                                        )
                                )
                        ORDER BY po.orderDate DESC
                        """)
        Page<PurchaseOrder> findFilteredPurchaseOrders(
                        @Param("retailerId") Long retailerId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end,
                        @Param("searchPattern") String searchPattern,
                        Pageable pageable);

        @Query("""
                        SELECT COALESCE(SUM(po.totalAmount), 0)
                        FROM PurchaseOrder po
                        WHERE po.retailerId = :retailerId
                                AND po.deletedAt IS NULL
                                AND po.orderDate >= :start
                                AND po.orderDate <= :end
                                AND (
                                        LOWER(CONCAT('po-', STR(po.id))) LIKE :searchPattern
                                        OR EXISTS (
                                                        SELECT 1
                                                        FROM Supplier s
                                                        WHERE s.id = po.supplierId
                                                                AND s.retailerId = :retailerId
                                                                AND s.deletedAt IS NULL
                                                                AND LOWER(s.companyName) LIKE :searchPattern
                                        )
                                )
                        """)
        BigDecimal sumFilteredPurchaseOrders(
                        @Param("retailerId") Long retailerId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end,
                        @Param("searchPattern") String searchPattern);

        @Query("""
                        SELECT COUNT(po)
                        FROM PurchaseOrder po
                        WHERE po.retailerId = :retailerId
                                AND po.deletedAt IS NULL
                                AND po.orderDate >= :start
                                AND po.orderDate <= :end
                                AND (
                                        LOWER(CONCAT('po-', STR(po.id))) LIKE :searchPattern
                                        OR EXISTS (
                                                        SELECT 1
                                                        FROM Supplier s
                                                        WHERE s.id = po.supplierId
                                                                AND s.retailerId = :retailerId
                                                                AND s.deletedAt IS NULL
                                                                AND LOWER(s.companyName) LIKE :searchPattern
                                        )
                                )
                        """)
        long countFilteredPurchaseOrders(
                        @Param("retailerId") Long retailerId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end,
                        @Param("searchPattern") String searchPattern);

        @Query("""
                        SELECT COALESCE(SUM(po.totalAmount - po.paidAmount), 0)
                        FROM PurchaseOrder po
                        WHERE po.retailerId = :retailerId
                                AND po.deletedAt IS NULL
                                AND po.paymentStatus IN ('pending', 'partial')
                                AND po.orderDate >= :start
                                AND po.orderDate <= :end
                                AND (
                                        LOWER(CONCAT('po-', STR(po.id))) LIKE :searchPattern
                                        OR EXISTS (
                                                        SELECT 1
                                                        FROM Supplier s
                                                        WHERE s.id = po.supplierId
                                                                AND s.retailerId = :retailerId
                                                                AND s.deletedAt IS NULL
                                                                AND LOWER(s.companyName) LIKE :searchPattern
                                        )
                                )
                        """)
        BigDecimal sumFilteredPendingPayments(
                        @Param("retailerId") Long retailerId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end,
                        @Param("searchPattern") String searchPattern);

        @Query("""
                        SELECT COALESCE(SUM(po.totalAmount), 0)
                        FROM PurchaseOrder po
                        WHERE po.retailerId = :retailerId
                          AND po.orderDate BETWEEN :start AND :end
                          AND po.status = 'received'
                          AND po.deletedAt IS NULL
                        """)
        BigDecimal sumPurchasesByRetailerIdAndDateRange(
                        @Param("retailerId") Long retailerId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        @Query("""
                        SELECT COALESCE(SUM(po.totalAmount - po.paidAmount), 0)
                        FROM PurchaseOrder po
                        WHERE po.retailerId = :retailerId
                          AND po.paymentStatus IN ('pending', 'partial')
                          AND po.deletedAt IS NULL
                        """)
        BigDecimal sumPendingPaymentsByRetailerId(
                        @Param("retailerId") Long retailerId);

}
