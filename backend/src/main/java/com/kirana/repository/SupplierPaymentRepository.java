package com.kirana.repository;

import com.kirana.entity.SupplierPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SupplierPaymentRepository extends JpaRepository<SupplierPayment, Long> {
    List<SupplierPayment> findByRetailerIdOrderByPaymentDateDesc(Long retailerId);
    List<SupplierPayment> findBySupplierIdOrderByPaymentDateDesc(Long supplierId);
    List<SupplierPayment> findBySupplierIdAndRetailerIdOrderByPaymentDateDesc(Long supplierId, Long retailerId);
    List<SupplierPayment> findByPurchaseOrderId(Long purchaseOrderId);
}
