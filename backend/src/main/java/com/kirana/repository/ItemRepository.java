package com.kirana.repository;

import com.kirana.entity.Item;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByRetailerIdAndDeletedAtIsNull(Long retailerId);

    Page<Item> findByRetailerIdAndDeletedAtIsNull(Long retailerId, Pageable pageable);

    Optional<Item> findByIdAndRetailerIdAndDeletedAtIsNull(Long id, Long retailerId);

    List<Item> findByIdInAndRetailerIdAndDeletedAtIsNull(List<Long> ids, Long retailerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Item i WHERE i.id = :id AND i.retailerId = :retailerId AND i.deletedAt IS NULL")
    Optional<Item> findByIdAndRetailerIdAndDeletedAtIsNullForUpdate(@Param("id") Long id,
            @Param("retailerId") Long retailerId);

    List<Item> findByRetailerIdAndCategoryAndDeletedAtIsNull(Long retailerId, String category);

    long countByRetailerIdAndDeletedAtIsNull(Long retailerId);

    @Query("SELECT DISTINCT i.category FROM Item i WHERE i.retailerId = :retailerId AND i.deletedAt IS NULL AND i.category IS NOT NULL")
    List<String> findDistinctCategoriesByRetailerId(@Param("retailerId") Long retailerId);

    @Query("SELECT i FROM Item i WHERE i.retailerId = :retailerId AND i.deletedAt IS NULL AND i.isActive = true AND i.currentStock <= i.minStockThreshold")
    List<Item> findLowStockItems(@Param("retailerId") Long retailerId);

    @Query("SELECT i FROM Item i WHERE i.retailerId = :retailerId AND i.deletedAt IS NULL AND i.isActive = true AND i.currentStock > 0 AND (LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(i.sku) LIKE LOWER(CONCAT('%', :search, '%')) OR (i.barcode IS NOT NULL AND LOWER(i.barcode) LIKE LOWER(CONCAT('%', :search, '%'))))")
    List<Item> searchAvailableItems(@Param("retailerId") Long retailerId, @Param("search") String search);
}
