package com.kirana.service;

import com.kirana.dto.SaleDto;
import com.kirana.entity.*;
import com.kirana.exception.NotFoundException;
import com.kirana.exception.ValidationException;
import com.kirana.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaleService {

        private static final LocalDateTime ALL_TIME_START = LocalDate.of(1970, 1, 1).atStartOfDay();
        private static final LocalDateTime ALL_TIME_END = LocalDate.of(9999, 12, 31).atTime(LocalTime.MAX);

        private final SaleRepository saleRepository;
        private final SaleItemRepository saleItemRepository;
        private final ItemRepository itemRepository;
        private final CustomerRepository customerRepository;
        private final InventoryTransactionRepository inventoryTransactionRepository;

        @Transactional(readOnly = true)
        public Map<String, Object> getSales(Long retailerId) {
                return getSales(retailerId, null, null, null, null);
        }

        @Transactional(readOnly = true)
        public Map<String, Object> getSales(Long retailerId, String search, String dateFilter) {
                return getSales(retailerId, search, dateFilter, null, null);
        }

        @Transactional(readOnly = true)
        public Map<String, Object> getSales(Long retailerId, String search, String dateFilter, Integer page,
                        Integer limit) {
                LocalDateTime[] range = resolveDateRange(dateFilter);
                LocalDateTime start = range != null ? range[0] : ALL_TIME_START;
                LocalDateTime end = range != null ? range[1] : ALL_TIME_END;
                String searchPattern = normalizeSearchPattern(search);
                Pageable pageable = resolvePageable(page, limit);

                Page<Sale> salesPage = saleRepository.findFilteredSales(retailerId, start, end, searchPattern,
                                pageable);
                List<Sale> sales = salesPage.getContent();

                List<Long> saleIds = sales.stream().map(Sale::getId).toList();
                List<Long> customerIds = sales.stream()
                                .map(Sale::getCustomerId)
                                .filter(Objects::nonNull)
                                .distinct()
                                .toList();
                Map<Long, String> customerNamesById = customerIds.isEmpty()
                                ? Map.of()
                                : customerRepository.findByIdInAndRetailerIdAndDeletedAtIsNull(customerIds, retailerId)
                                                .stream()
                                                .collect(Collectors.toMap(Customer::getId, Customer::getName));

                Map<Long, Integer> itemCountBySaleId = new HashMap<>();
                if (!saleIds.isEmpty()) {
                        for (Object[] row : saleItemRepository.countItemsBySaleIds(saleIds)) {
                                Long saleId = (Long) row[0];
                                Number itemCount = (Number) row[1];
                                itemCountBySaleId.put(saleId, itemCount.intValue());
                        }
                }

                List<SaleDto> dtos = sales.stream()
                                .map(s -> toDto(
                                                s,
                                                resolveCustomerName(s.getCustomerId(), customerNamesById),
                                                itemCountBySaleId.getOrDefault(s.getId(), 0),
                                                false,
                                                retailerId))
                                .toList();

                long totalBills = saleRepository.countFilteredSales(retailerId, start, end, searchPattern);
                BigDecimal totalSales = orZero(saleRepository.sumFilteredSales(retailerId, start, end, searchPattern));
                BigDecimal totalProfit = orZero(
                                saleItemRepository.sumFilteredProfit(retailerId, start, end, searchPattern));
                int currentPage = pageable.isPaged() ? pageable.getPageNumber() + 1 : 1;
                int pageLimit = pageable.isPaged() ? pageable.getPageSize() : Math.max(1, dtos.size());

                return Map.of(
                                "sales", dtos,
                                "pagination", Map.of(
                                                "current_page", currentPage,
                                                "limit", pageLimit,
                                                "total_items", totalBills,
                                                "total_pages", pageable.isPaged()
                                                                ? Math.max(1, (int) Math
                                                                                .ceil((double) totalBills / pageLimit))
                                                                : 1),
                                "summary", Map.of(
                                                "total_sales", totalSales,
                                                "total_bills", totalBills,
                                                "total_profit", totalProfit,
                                                "cash_sales", BigDecimal.ZERO,
                                                "card_sales", BigDecimal.ZERO,
                                                "upi_sales", BigDecimal.ZERO,
                                                "pending_amount", BigDecimal.ZERO));
        }

        private LocalDateTime[] resolveDateRange(String dateFilter) {
                if (dateFilter == null || "all".equals(dateFilter))
                        return null;
                LocalDate today = LocalDate.now();
                return switch (dateFilter) {
                        case "today" -> new LocalDateTime[] { today.atStartOfDay(), today.atTime(LocalTime.MAX) };
                        case "week" -> new LocalDateTime[] { today.with(java.time.DayOfWeek.MONDAY).atStartOfDay(),
                                        today.atTime(LocalTime.MAX) };
                        case "month" ->
                                new LocalDateTime[] { today.with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay(),
                                                today.atTime(LocalTime.MAX) };
                        case "year" ->
                                new LocalDateTime[] { today.with(TemporalAdjusters.firstDayOfYear()).atStartOfDay(),
                                                today.atTime(LocalTime.MAX) };
                        default -> null;
                };
        }

        @Transactional(readOnly = true)
        public SaleDto getSaleById(Long id, Long retailerId) {
                Sale sale = saleRepository.findByIdAndRetailerIdAndDeletedAtIsNull(id, retailerId)
                                .orElseThrow(() -> new NotFoundException("Sale not found"));
                Map<Long, String> itemNamesById = resolveItemNames(
                                sale.getItems().stream().map(SaleItem::getItemId).distinct().toList(),
                                retailerId);
                return toDto(
                                sale,
                                resolveCustomerName(sale.getCustomerId(), retailerId),
                                sale.getItems().size(),
                                true,
                                retailerId,
                                itemNamesById);
        }

        @Transactional(readOnly = true)
        public Map<String, Object> getSaleDetails(Long id, Long retailerId) {
                Sale sale = saleRepository.findByIdAndRetailerIdAndDeletedAtIsNull(id, retailerId)
                                .orElseThrow(() -> new NotFoundException("Sale not found"));
                Map<Long, String> itemNamesById = resolveItemNames(
                                sale.getItems().stream().map(SaleItem::getItemId).distinct().toList(),
                                retailerId);
                SaleDto dto = toDto(
                                sale,
                                resolveCustomerName(sale.getCustomerId(), retailerId),
                                sale.getItems().size(),
                                true,
                                retailerId,
                                itemNamesById);

                List<Map<String, Object>> items = sale.getItems().stream().map(si -> {
                        String itemName = itemNamesById.getOrDefault(si.getItemId(), "Unknown");
                        return Map.<String, Object>of(
                                        "item_name", itemName,
                                        "quantity", si.getQuantity(),
                                        "unit_price", si.getUnitSellingPrice(),
                                        "total", si.getAmount());
                }).toList();

                return Map.of("sale", dto, "items", items);
        }

        @Transactional
        public SaleDto createSale(SaleDto dto, Long retailerId) {
                if (dto.getItems() == null || dto.getItems().isEmpty()) {
                        throw new ValidationException("Sale must contain at least one item");
                }
                if (dto.getFinalAmount() == null || dto.getFinalAmount().compareTo(BigDecimal.ZERO) < 0) {
                        throw new ValidationException("Final amount must be non-negative");
                }

                Sale sale = Sale.builder()
                                .retailerId(retailerId)
                                .customerId(dto.getCustomerId())
                                .totalAmount(dto.getTotalAmount())
                                .discount(dto.getDiscount() != null ? dto.getDiscount() : BigDecimal.ZERO)
                                .finalAmount(dto.getFinalAmount())
                                .paymentMethod(dto.getPaymentMethod())
                                .paymentStatus(dto.getPaymentStatus() != null ? dto.getPaymentStatus() : "paid")
                                .paidAmount(dto.getPaidAmount() != null ? dto.getPaidAmount() : dto.getFinalAmount())
                                .notes(dto.getNotes())
                                .items(new ArrayList<>())
                                .build();

                for (SaleDto.SaleItemDto itemDto : dto.getItems()) {
                        Item item = itemRepository
                                        .findByIdAndRetailerIdAndDeletedAtIsNullForUpdate(itemDto.getItemId(),
                                                        retailerId)
                                        .orElseThrow(() -> new NotFoundException(
                                                        "Item not found: " + itemDto.getItemId()));

                        if (item.getCurrentStock().compareTo(itemDto.getQuantity()) < 0) {
                                throw new ValidationException("Insufficient stock for " + item.getName()
                                                + ". Available: " + item.getCurrentStock() + ", requested: "
                                                + itemDto.getQuantity());
                        }

                        BigDecimal costPrice = item.getPurchasePrice();
                        BigDecimal amount = itemDto.getQuantity().multiply(itemDto.getUnitPrice());
                        BigDecimal profit = amount.subtract(itemDto.getQuantity().multiply(costPrice));

                        SaleItem saleItem = SaleItem.builder()
                                        .sale(sale)
                                        .itemId(itemDto.getItemId())
                                        .quantity(itemDto.getQuantity())
                                        .unitSellingPrice(itemDto.getUnitPrice())
                                        .unitCostPrice(costPrice)
                                        .amount(amount)
                                        .profit(profit)
                                        .build();
                        sale.getItems().add(saleItem);

                        item.setCurrentStock(item.getCurrentStock().subtract(itemDto.getQuantity()));
                        item.setLastSaleDate(LocalDateTime.now());
                        itemRepository.save(item);
                }

                Sale savedSale = saleRepository.save(sale);
                Map<Long, String> itemNamesById = resolveItemNames(
                                savedSale.getItems().stream().map(SaleItem::getItemId).distinct().toList(),
                                retailerId);
                return toDto(
                                savedSale,
                                resolveCustomerName(savedSale.getCustomerId(), retailerId),
                                savedSale.getItems().size(),
                                true,
                                retailerId,
                                itemNamesById);
        }

        @Transactional
        public void deleteSale(Long id, Long retailerId) {
                Sale sale = saleRepository.findByIdAndRetailerIdAndDeletedAtIsNull(id, retailerId)
                                .orElseThrow(() -> new NotFoundException("Sale not found"));

                for (SaleItem saleItem : sale.getItems()) {
                        Item item = itemRepository
                                        .findByIdAndRetailerIdAndDeletedAtIsNullForUpdate(saleItem.getItemId(),
                                                        retailerId)
                                        .orElseThrow(() -> new NotFoundException(
                                                        "Item not found: " + saleItem.getItemId()));

                        BigDecimal previousStock = item.getCurrentStock();
                        BigDecimal restoredStock = previousStock.add(saleItem.getQuantity());
                        item.setCurrentStock(restoredStock);
                        itemRepository.save(item);

                        InventoryTransaction txn = InventoryTransaction.builder()
                                        .retailerId(retailerId)
                                        .itemId(item.getId())
                                        .transactionType("SALE_REVERSAL")
                                        .quantity(saleItem.getQuantity())
                                        .referenceType("SALE")
                                        .referenceId(sale.getId())
                                        .previousStock(previousStock)
                                        .newStock(restoredStock)
                                        .notes("Stock restored after sale deletion")
                                        .build();
                        inventoryTransactionRepository.save(txn);
                }

                sale.setDeletedAt(LocalDateTime.now());
                saleRepository.save(sale);
        }

        private SaleDto toDto(Sale s, String customerName, int itemsCount, boolean includeItems, Long retailerId) {
                return toDto(s, customerName, itemsCount, includeItems, retailerId, null);
        }

        private SaleDto toDto(Sale s, String customerName, int itemsCount, boolean includeItems, Long retailerId,
                        Map<Long, String> itemNamesById) {
                List<SaleDto.SaleItemDto> itemDtos = null;
                if (includeItems) {
                        itemDtos = s.getItems().stream().map(si -> {
                                String itemName;
                                if (itemNamesById != null) {
                                        itemName = itemNamesById.getOrDefault(si.getItemId(), "Unknown");
                                } else {
                                        itemName = itemRepository
                                                        .findByIdAndRetailerIdAndDeletedAtIsNull(si.getItemId(),
                                                                        retailerId)
                                                        .map(Item::getName).orElse("Unknown");
                                }
                                return SaleDto.SaleItemDto.builder()
                                                .itemId(si.getItemId())
                                                .itemName(itemName)
                                                .quantity(si.getQuantity())
                                                .unitPrice(si.getUnitSellingPrice())
                                                .unitCostPrice(si.getUnitCostPrice())
                                                .build();
                        }).toList();
                }

                return SaleDto.builder()
                                .id(s.getId())
                                .billNumber("BILL-" + s.getId())
                                .customerId(s.getCustomerId())
                                .customerName(customerName)
                                .saleDate(s.getSaleDate() != null ? s.getSaleDate().toString() : null)
                                .totalAmount(orZero(s.getTotalAmount()))
                                .discount(orZero(s.getDiscount()))
                                .finalAmount(orZero(s.getFinalAmount()))
                                .paymentMethod(s.getPaymentMethod())
                                .paymentStatus(s.getPaymentStatus())
                                .paidAmount(orZero(s.getPaidAmount()))
                                .itemsCount(itemsCount)
                                .notes(s.getNotes())
                                .items(itemDtos)
                                .build();
        }

        private String resolveCustomerName(Long customerId, Long retailerId) {
                if (customerId == null) {
                        return "Walk-in Customer";
                }
                return customerRepository.findByIdAndRetailerIdAndDeletedAtIsNull(customerId, retailerId)
                                .map(Customer::getName)
                                .orElse("Walk-in Customer");
        }

        private String resolveCustomerName(Long customerId, Map<Long, String> customerNamesById) {
                if (customerId == null) {
                        return "Walk-in Customer";
                }
                return customerNamesById.getOrDefault(customerId, "Walk-in Customer");
        }

        private BigDecimal orZero(BigDecimal value) {
                return value != null ? value : BigDecimal.ZERO;
        }

        private String normalizeSearchPattern(String search) {
                if (search == null) {
                        return "%";
                }
                String trimmed = search.trim();
                return trimmed.isEmpty() ? "%" : "%" + trimmed.toLowerCase() + "%";
        }

        private Pageable resolvePageable(Integer page, Integer limit) {
                if (page == null || limit == null) {
                        return Pageable.unpaged();
                }

                int safePage = Math.max(1, page);
                int safeLimit = Math.max(1, Math.min(limit, 200));
                return PageRequest.of(safePage - 1, safeLimit);
        }

        private Map<Long, String> resolveItemNames(List<Long> itemIds, Long retailerId) {
                if (itemIds == null || itemIds.isEmpty()) {
                        return Map.of();
                }

                return itemRepository.findByIdInAndRetailerIdAndDeletedAtIsNull(itemIds, retailerId)
                                .stream()
                                .collect(Collectors.toMap(Item::getId, Item::getName));
        }
}
