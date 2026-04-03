package com.kirana.service;

import com.kirana.dto.ItemDto;
import com.kirana.dto.StockAdjustmentRequest;
import com.kirana.entity.InventoryTransaction;
import com.kirana.entity.Item;
import com.kirana.exception.NotFoundException;
import com.kirana.exception.ValidationException;
import com.kirana.repository.InventoryTransactionRepository;
import com.kirana.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ItemService {

        private final ItemRepository itemRepository;
        private final InventoryTransactionRepository inventoryTransactionRepository;

        public List<ItemDto> getItems(Long retailerId) {
                return itemRepository.findByRetailerIdAndDeletedAtIsNull(retailerId).stream()
                                .map(this::toDto)
                                .toList();
        }

        public Map<String, Object> getItems(Long retailerId, int page, int limit) {
                int normalizedPage = Math.max(1, page);
                int normalizedLimit = normalizeLimit(limit);

                Page<Item> itemPage = itemRepository.findByRetailerIdAndDeletedAtIsNull(
                                retailerId,
                                PageRequest.of(normalizedPage - 1, normalizedLimit));

                List<ItemDto> itemDtos = itemPage.getContent().stream().map(this::toDto).toList();

                return Map.of(
                                "items", itemDtos,
                                "pagination", Map.of(
                                                "total", itemPage.getTotalElements(),
                                                "page", normalizedPage,
                                                "limit", normalizedLimit,
                                                "total_pages", Math.max(itemPage.getTotalPages(), 1)));
        }

        public ItemDto getItemById(Long id, Long retailerId) {
                Item item = itemRepository.findByIdAndRetailerIdAndDeletedAtIsNull(id, retailerId)
                                .orElseThrow(() -> new NotFoundException("Item not found"));
                return toDto(item);
        }

        public List<ItemDto> getAvailableItems(Long retailerId) {
                return getAvailableItems(retailerId, null);
        }

        public List<ItemDto> getAvailableItems(Long retailerId, String search) {
                if (search != null && !search.trim().isEmpty()) {
                        return itemRepository.searchAvailableItems(retailerId, search.trim()).stream()
                                        .map(this::toDto)
                                        .toList();
                }
                return itemRepository.findByRetailerIdAndDeletedAtIsNull(retailerId).stream()
                                .filter(i -> i.getIsActive() && i.getCurrentStock().compareTo(BigDecimal.ZERO) > 0)
                                .map(this::toDto)
                                .toList();
        }

        public Map<String, Object> getItemsInventory(Long retailerId) {
                List<Item> items = itemRepository.findByRetailerIdAndDeletedAtIsNull(retailerId);
                List<ItemDto> itemDtos = items.stream().map(this::toDto).toList();

                long lowStock = items.stream()
                                .filter(i -> i.getIsActive()
                                                && i.getCurrentStock().compareTo(i.getMinStockThreshold()) <= 0
                                                && i.getCurrentStock().compareTo(BigDecimal.ZERO) > 0)
                                .count();
                long outOfStock = items.stream()
                                .filter(i -> i.getIsActive() && i.getCurrentStock().compareTo(BigDecimal.ZERO) <= 0)
                                .count();
                BigDecimal stockValue = items.stream()
                                .map(i -> i.getPurchasePrice().multiply(i.getCurrentStock()))
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                return Map.of(
                                "items", itemDtos,
                                "summary", Map.of(
                                                "total_items", items.size(),
                                                "low_stock_items", lowStock,
                                                "out_of_stock_items", outOfStock,
                                                "total_stock_value", stockValue));
        }

        public List<ItemDto> getLowStockItems(Long retailerId) {
                return itemRepository.findLowStockItems(retailerId).stream()
                                .map(this::toDto)
                                .toList();
        }

        public ItemDto addItem(ItemDto dto, Long retailerId) {
                Item item = Item.builder()
                                .retailerId(retailerId)
                                .name(dto.getName())
                                .description(dto.getDescription())
                                .sku(dto.getSku())
                                .barcode(dto.getBarcode())
                                .category(dto.getCategory())
                                .unit(dto.getUnit())
                                .purchasePrice(dto.getPurchasePrice())
                                .sellingPrice(dto.getSellingPrice())
                                .currentStock(dto.getCurrentStock() != null ? dto.getCurrentStock() : BigDecimal.ZERO)
                                .minStockThreshold(dto.getMinStockThreshold() != null ? dto.getMinStockThreshold()
                                                : BigDecimal.ZERO)
                                .reorderPoint(dto.getReorderPoint() != null ? dto.getReorderPoint() : BigDecimal.ZERO)
                                .maxStockLevel(dto.getMaxStockLevel())
                                .isActive(true)
                                .build();
                return toDto(itemRepository.save(item));
        }

        public ItemDto updateItem(Long id, ItemDto dto, Long retailerId) {
                Item item = itemRepository.findByIdAndRetailerIdAndDeletedAtIsNull(id, retailerId)
                                .orElseThrow(() -> new NotFoundException("Item not found"));
                item.setName(dto.getName());
                item.setDescription(dto.getDescription());
                item.setSku(dto.getSku());
                item.setBarcode(dto.getBarcode());
                item.setCategory(dto.getCategory());
                item.setUnit(dto.getUnit());
                item.setPurchasePrice(dto.getPurchasePrice());
                item.setSellingPrice(dto.getSellingPrice());
                item.setMinStockThreshold(dto.getMinStockThreshold());
                item.setReorderPoint(dto.getReorderPoint());
                item.setMaxStockLevel(dto.getMaxStockLevel());
                return toDto(itemRepository.save(item));
        }

        public void deleteItem(Long id, Long retailerId) {
                Item item = itemRepository.findByIdAndRetailerIdAndDeletedAtIsNull(id, retailerId)
                                .orElseThrow(() -> new NotFoundException("Item not found"));
                item.setDeletedAt(LocalDateTime.now());
                itemRepository.save(item);
        }

        @Transactional
        public ItemDto adjustStock(Long id, StockAdjustmentRequest request, Long retailerId) {
                Item item = itemRepository.findByIdAndRetailerIdAndDeletedAtIsNullForUpdate(id, retailerId)
                                .orElseThrow(() -> new NotFoundException("Item not found"));

                if (request.getType() == null
                                || (!request.getType().equals("add") && !request.getType().equals("subtract"))) {
                        throw new ValidationException("Stock adjustment type must be 'add' or 'subtract'");
                }

                BigDecimal previousStock = item.getCurrentStock();
                BigDecimal adjustment = request.getQuantity();
                if ("subtract".equals(request.getType())) {
                        if (previousStock.compareTo(adjustment) < 0) {
                                throw new ValidationException(
                                                "Insufficient stock. Current: " + previousStock + ", requested: "
                                                                + adjustment);
                        }
                        adjustment = adjustment.negate();
                }
                BigDecimal newStock = previousStock.add(adjustment);
                item.setCurrentStock(newStock);
                itemRepository.save(item);

                InventoryTransaction txn = InventoryTransaction.builder()
                                .retailerId(retailerId)
                                .itemId(id)
                                .transactionType("subtract".equals(request.getType()) ? "ADJUSTMENT_OUT"
                                                : "ADJUSTMENT_IN")
                                .quantity(request.getQuantity())
                                .previousStock(previousStock)
                                .newStock(newStock)
                                .notes(request.getNotes())
                                .referenceType("MANUAL_ADJUSTMENT")
                                .build();
                inventoryTransactionRepository.save(txn);

                return toDto(item);
        }

        public List<InventoryTransaction> getItemTransactions(Long itemId, Long retailerId) {
                itemRepository.findByIdAndRetailerIdAndDeletedAtIsNull(itemId, retailerId)
                                .orElseThrow(() -> new NotFoundException("Item not found"));
                return inventoryTransactionRepository.findByItemIdAndRetailerIdOrderByCreatedAtDesc(itemId, retailerId);
        }

        private ItemDto toDto(Item i) {
                return ItemDto.builder()
                                .id(i.getId())
                                .name(i.getName())
                                .description(i.getDescription())
                                .sku(i.getSku())
                                .barcode(i.getBarcode())
                                .category(i.getCategory())
                                .unit(i.getUnit())
                                .purchasePrice(i.getPurchasePrice())
                                .sellingPrice(i.getSellingPrice())
                                .currentStock(i.getCurrentStock())
                                .minStockThreshold(i.getMinStockThreshold())
                                .reorderPoint(i.getReorderPoint())
                                .maxStockLevel(i.getMaxStockLevel())
                                .isAvailable(i.getIsActive() && i.getCurrentStock().compareTo(BigDecimal.ZERO) > 0)
                                .isLowStock(i.getCurrentStock().compareTo(i.getMinStockThreshold()) <= 0)
                                .lastPurchaseDate(i.getLastPurchaseDate() != null ? i.getLastPurchaseDate().toString()
                                                : null)
                                .lastSaleDate(i.getLastSaleDate() != null ? i.getLastSaleDate().toString() : null)
                                .build();
        }

        private int normalizeLimit(int limit) {
                return Math.min(Math.max(1, limit), 200);
        }
}
