package com.kirana.repository;

import com.kirana.entity.DailySummary;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailySummaryRepository extends JpaRepository<DailySummary, Long> {
    Optional<DailySummary> findByRetailerIdAndSummaryDate(Long retailerId, LocalDate summaryDate);
    List<DailySummary> findByRetailerIdAndSummaryDateBetweenOrderBySummaryDateDesc(Long retailerId, LocalDate start, LocalDate end);
}
