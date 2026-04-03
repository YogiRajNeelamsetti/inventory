package com.kirana.repository;

import com.kirana.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByRetailerIdAndDeletedAtIsNull(Long retailerId);

    List<Customer> findByIdInAndRetailerIdAndDeletedAtIsNull(List<Long> ids, Long retailerId);

    Page<Customer> findByRetailerIdAndDeletedAtIsNull(Long retailerId, Pageable pageable);

    Optional<Customer> findByIdAndRetailerIdAndDeletedAtIsNull(Long id, Long retailerId);

    long countByRetailerIdAndDeletedAtIsNull(Long retailerId);

    @Query("SELECT c FROM Customer c WHERE c.retailerId = :retailerId AND c.deletedAt IS NULL AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR c.phoneNumber LIKE CONCAT('%', :search, '%'))")
    List<Customer> searchCustomers(@Param("retailerId") Long retailerId, @Param("search") String search);

    @Query("SELECT c FROM Customer c WHERE c.retailerId = :retailerId AND c.deletedAt IS NULL AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR c.phoneNumber LIKE CONCAT('%', :search, '%'))")
    Page<Customer> searchCustomers(@Param("retailerId") Long retailerId, @Param("search") String search,
            Pageable pageable);
}
