package com.kirana.repository;

import com.kirana.entity.ReturnItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReturnItemRepository extends JpaRepository<ReturnItem, Long> {
    List<ReturnItem> findByReturnOrderId(Long returnId);
}
