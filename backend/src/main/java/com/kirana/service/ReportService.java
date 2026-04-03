package com.kirana.service;

import com.kirana.entity.Item;
import com.kirana.repository.ItemRepository;
import com.kirana.repository.SaleItemRepository;
import com.kirana.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ItemRepository itemRepository;

    public Map<String, Object> getSummaryReport(Long retailerId) {
        BigDecimal totalProfit = saleItemRepository.sumProfitByRetailerId(retailerId);
        List<Item> items = itemRepository.findByRetailerIdAndDeletedAtIsNull(retailerId);
        BigDecimal inventoryValue = items.stream()
                .map(i -> i.getPurchasePrice().multiply(i.getCurrentStock()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
                "total_sales", BigDecimal.ZERO,
                "total_purchases", BigDecimal.ZERO,
                "total_profit", totalProfit,
                "inventory_value", inventoryValue
        );
    }

    public List<Map<String, Object>> getTopItems(Long retailerId) {
        // Return top items by selling price as a simplified version
        List<Item> items = itemRepository.findByRetailerIdAndDeletedAtIsNull(retailerId);
        return items.stream()
                .sorted((a, b) -> b.getSellingPrice().compareTo(a.getSellingPrice()))
                .limit(10)
                .map(i -> Map.<String, Object>of(
                        "id", i.getId(),
                        "name", i.getName(),
                        "category", i.getCategory() != null ? i.getCategory() : "",
                        "selling_price", i.getSellingPrice(),
                        "total_sold", BigDecimal.ZERO,
                        "total_revenue", BigDecimal.ZERO
                ))
                .toList();
    }
}
