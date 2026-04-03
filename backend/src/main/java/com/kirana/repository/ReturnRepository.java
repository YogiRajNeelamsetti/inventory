package com.kirana.repository;

import com.kirana.entity.Return;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReturnRepository extends JpaRepository<Return, Long> {
    List<Return> findByRetailerIdOrderByReturnDateDesc(Long retailerId);
}
