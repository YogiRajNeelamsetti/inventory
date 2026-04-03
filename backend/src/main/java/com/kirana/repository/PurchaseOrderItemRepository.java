package com.kirana.repository;

import com.kirana.entity.PurchaseOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, Long> {
    List<PurchaseOrderItem> findByPurchaseOrderId(Long purchaseOrderId);

    @Query("""
            SELECT poi.purchaseOrder.id, COUNT(poi.id)
            FROM PurchaseOrderItem poi
            WHERE poi.purchaseOrder.id IN :purchaseOrderIds
            GROUP BY poi.purchaseOrder.id
            """)
    List<Object[]> countItemsByPurchaseOrderIds(@Param("purchaseOrderIds") List<Long> purchaseOrderIds);
}
