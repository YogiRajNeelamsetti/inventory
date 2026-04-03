package com.kirana.repository;

import com.kirana.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDateTime;

public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {
    List<SaleItem> findBySaleId(Long saleId);

    @Query("SELECT COALESCE(SUM(si.profit), 0) FROM SaleItem si WHERE si.sale.retailerId = :retailerId AND si.sale.deletedAt IS NULL")
    BigDecimal sumProfitByRetailerId(@Param("retailerId") Long retailerId);

    @Query("""
            SELECT COALESCE(SUM(si.profit), 0)
            FROM SaleItem si
            JOIN si.sale s
            WHERE s.retailerId = :retailerId
              AND s.saleDate BETWEEN :start AND :end
              AND s.deletedAt IS NULL
            """)
    BigDecimal sumProfitByRetailerIdAndDateRange(
            @Param("retailerId") Long retailerId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("""
            SELECT si.sale.id, COUNT(si.id)
            FROM SaleItem si
            WHERE si.sale.id IN :saleIds
            GROUP BY si.sale.id
            """)
    List<Object[]> countItemsBySaleIds(@Param("saleIds") List<Long> saleIds);

    @Query("""
            SELECT COALESCE(SUM(si.profit), 0)
            FROM SaleItem si
            WHERE si.sale.id IN :saleIds
            """)
    BigDecimal sumProfitBySaleIds(@Param("saleIds") List<Long> saleIds);

    @Query("""
            SELECT COALESCE(SUM(si.profit), 0)
            FROM SaleItem si
            JOIN si.sale s
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
    BigDecimal sumFilteredProfit(
            @Param("retailerId") Long retailerId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("searchPattern") String searchPattern);

}
