package com.kirana.repository;

import com.kirana.entity.Retailer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RetailerRepository extends JpaRepository<Retailer, Long> {
    Optional<Retailer> findByEmailAndDeletedAtIsNull(String email);
    Optional<Retailer> findByPhoneNumberAndDeletedAtIsNull(String phoneNumber);
    Optional<Retailer> findByIdAndDeletedAtIsNull(Long id);
    Optional<Retailer> findFirstByDeletedAtIsNullOrderByIdAsc();
}
