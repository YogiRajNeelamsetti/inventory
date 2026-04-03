package com.kirana.service;

import com.kirana.entity.Item;
import com.kirana.exception.ValidationException;
import com.kirana.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final ItemRepository itemRepository;

    public List<Map<String, Object>> getCategories(Long retailerId) {
        List<Item> items = itemRepository.findByRetailerIdAndDeletedAtIsNull(retailerId);
        Map<String, List<Item>> grouped = items.stream()
                .filter(i -> i.getCategory() != null)
                .collect(Collectors.groupingBy(Item::getCategory));

        return grouped.entrySet().stream().map(entry -> {
            String category = entry.getKey();
            List<Item> categoryItems = entry.getValue();
            BigDecimal stockValue = categoryItems.stream()
                    .map(i -> i.getPurchasePrice().multiply(i.getCurrentStock()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            return Map.<String, Object>of(
                    "id", category.hashCode(),
                    "name", category,
                    "item_count", categoryItems.size(),
                    "total_stock_value", stockValue
            );
        }).toList();
    }

    public void addCategory(String name, Long retailerId) {
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Category name is required");
        }
    }

    public void updateCategory(Long id, String name, Long retailerId) {
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Category name is required");
        }
    }

    public void deleteCategory(Long id, Long retailerId) {
        // no-op: categories are derived from items
    }
}
