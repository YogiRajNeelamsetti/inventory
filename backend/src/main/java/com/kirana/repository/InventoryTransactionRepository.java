package com.kirana.repository;

import com.kirana.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findByRetailerIdOrderByCreatedAtDesc(Long retailerId);
    List<InventoryTransaction> findByItemIdOrderByCreatedAtDesc(Long itemId);
    List<InventoryTransaction> findByItemIdAndRetailerIdOrderByCreatedAtDesc(Long itemId, Long retailerId);
}
