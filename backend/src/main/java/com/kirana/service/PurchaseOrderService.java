package com.kirana.service;

import com.kirana.dto.PurchaseOrderDto;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private static final LocalDateTime ALL_TIME_START = LocalDate.of(1970, 1, 1).atStartOfDay();
    private static final LocalDateTime ALL_TIME_END = LocalDate.of(9999, 12, 31).atTime(LocalTime.MAX);

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final SupplierRepository supplierRepository;
    private final ItemRepository itemRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getPurchaseOrders(Long retailerId) {
        return getPurchaseOrders(retailerId, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPurchaseOrders(Long retailerId, String search, String dateFilter) {
        return getPurchaseOrders(retailerId, search, dateFilter, null, null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPurchaseOrders(Long retailerId, String search, String dateFilter, Integer page,
            Integer limit) {
        LocalDateTime[] range = resolveDateRange(dateFilter);
        LocalDateTime start = range != null ? range[0] : ALL_TIME_START;
        LocalDateTime end = range != null ? range[1] : ALL_TIME_END;
        String searchPattern = normalizeSearchPattern(search);
        Pageable pageable = resolvePageable(page, limit);

        Page<PurchaseOrder> ordersPage = purchaseOrderRepository.findFilteredPurchaseOrders(
                retailerId,
                start,
                end,
                searchPattern,
                pageable);

        List<PurchaseOrder> orders = ordersPage.getContent();

        List<Long> supplierIds = orders.stream().map(PurchaseOrder::getSupplierId).distinct().toList();
        Map<Long, String> supplierNamesById = supplierIds.isEmpty()
                ? Map.of()
                : supplierRepository.findByIdInAndRetailerIdAndDeletedAtIsNull(supplierIds, retailerId)
                        .stream()
                        .collect(Collectors.toMap(Supplier::getId, Supplier::getCompanyName));

        List<Long> orderIds = orders.stream().map(PurchaseOrder::getId).toList();
        Map<Long, Integer> itemCountByOrderId = new HashMap<>();
        if (!orderIds.isEmpty()) {
            for (Object[] row : purchaseOrderItemRepository.countItemsByPurchaseOrderIds(orderIds)) {
                Long orderId = (Long) row[0];
                Number itemCount = (Number) row[1];
                itemCountByOrderId.put(orderId, itemCount.intValue());
            }
        }

        List<PurchaseOrderDto> dtos = orders.stream()
                .map(o -> toDto(
                        o,
                        resolveSupplierName(o.getSupplierId(), supplierNamesById),
                        itemCountByOrderId.getOrDefault(o.getId(), 0),
                        false,
                        retailerId))
                .toList();

        long totalOrders = purchaseOrderRepository.countFilteredPurchaseOrders(retailerId, start, end, searchPattern);
        BigDecimal totalPurchases = orZero(
                purchaseOrderRepository.sumFilteredPurchaseOrders(retailerId, start, end, searchPattern));
        BigDecimal pendingPayment = orZero(
                purchaseOrderRepository.sumFilteredPendingPayments(retailerId, start, end, searchPattern));
        int currentPage = pageable.isPaged() ? pageable.getPageNumber() + 1 : 1;
        int pageLimit = pageable.isPaged() ? pageable.getPageSize() : Math.max(1, dtos.size());

        return Map.of(
                "purchase_orders", dtos,
                "pagination", Map.of(
                        "current_page", currentPage,
                        "limit", pageLimit,
                        "total_items", totalOrders,
                        "total_pages", pageable.isPaged()
                                ? Math.max(1, (int) Math.ceil((double) totalOrders / pageLimit))
                                : 1),
                "summary", Map.of(
                        "total_purchases", totalPurchases,
                        "total_orders", totalOrders,
                        "pending_payment", pendingPayment));
    }

    private LocalDateTime[] resolveDateRange(String dateFilter) {
        if (dateFilter == null || "all".equals(dateFilter)) {
            return null;
        }
        LocalDate today = LocalDate.now();
        return switch (dateFilter) {
            case "today" -> new LocalDateTime[] { today.atStartOfDay(), today.atTime(LocalTime.MAX) };
            case "week" -> new LocalDateTime[] { today.with(java.time.DayOfWeek.MONDAY).atStartOfDay(),
                    today.atTime(LocalTime.MAX) };
            case "month" -> new LocalDateTime[] { today.with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay(),
                    today.atTime(LocalTime.MAX) };
            case "year" -> new LocalDateTime[] { today.with(TemporalAdjusters.firstDayOfYear()).atStartOfDay(),
                    today.atTime(LocalTime.MAX) };
            default -> null;
        };
    }

    @Transactional(readOnly = true)
    public PurchaseOrderDto getPurchaseOrderById(Long id, Long retailerId) {
        PurchaseOrder order = purchaseOrderRepository.findByIdAndRetailerIdAndDeletedAtIsNull(id, retailerId)
                .orElseThrow(() -> new NotFoundException("Purchase order not found"));
        Map<Long, String> itemNamesById = resolveItemNames(
                order.getItems().stream().map(PurchaseOrderItem::getItemId).distinct().toList(),
                retailerId);
        return toDto(
                order,
                resolveSupplierName(order.getSupplierId(), retailerId),
                order.getItems().size(),
                true,
                retailerId,
                itemNamesById);
    }

    @Transactional
    public PurchaseOrderDto createPurchaseOrder(PurchaseOrderDto dto, Long retailerId) {
        supplierRepository.findByIdAndRetailerIdAndDeletedAtIsNull(dto.getSupplierId(), retailerId)
                .orElseThrow(() -> new NotFoundException("Supplier not found"));

        if (dto.getTotalAmount() == null || dto.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Total amount must be positive");
        }

        PurchaseOrder order = PurchaseOrder.builder()
                .retailerId(retailerId)
                .supplierId(dto.getSupplierId())
                .totalAmount(dto.getTotalAmount())
                .notes(dto.getNotes())
                .status("pending")
                .paymentStatus("pending")
                .paidAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        if (dto.getItems() != null) {
            for (PurchaseOrderDto.PurchaseOrderItemDto itemDto : dto.getItems()) {
                itemRepository.findByIdAndRetailerIdAndDeletedAtIsNull(itemDto.getItemId(), retailerId)
                        .orElseThrow(() -> new NotFoundException("Item not found: " + itemDto.getItemId()));

                if (itemDto.getQuantity() == null || itemDto.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new ValidationException("Item quantity must be positive");
                }
                if (itemDto.getUnitPrice() == null || itemDto.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new ValidationException("Item unit price must be positive");
                }

                PurchaseOrderItem poi = PurchaseOrderItem.builder()
                        .purchaseOrder(order)
                        .itemId(itemDto.getItemId())
                        .quantity(itemDto.getQuantity())
                        .unitPrice(itemDto.getUnitPrice())
                        .amount(itemDto.getQuantity().multiply(itemDto.getUnitPrice()))
                        .build();
                order.getItems().add(poi);
            }
        }

        PurchaseOrder savedOrder = purchaseOrderRepository.save(order);
        Map<Long, String> itemNamesById = resolveItemNames(
                savedOrder.getItems().stream().map(PurchaseOrderItem::getItemId).distinct().toList(),
                retailerId);
        return toDto(
                savedOrder,
                resolveSupplierName(savedOrder.getSupplierId(), retailerId),
                savedOrder.getItems().size(),
                true,
                retailerId,
                itemNamesById);
    }

    @Transactional
    public PurchaseOrderDto updatePurchaseOrderStatus(Long id, String status, Long retailerId) {
        if (status == null
                || (!status.equals("pending") && !status.equals("received") && !status.equals("cancelled"))) {
            throw new ValidationException("Invalid status. Allowed values: pending, received, cancelled");
        }

        PurchaseOrder order = purchaseOrderRepository.findByIdAndRetailerIdAndDeletedAtIsNull(id, retailerId)
                .orElseThrow(() -> new NotFoundException("Purchase order not found"));

        String currentStatus = order.getStatus();
        if (currentStatus.equals(status)) {
            return toDto(
                    order,
                    resolveSupplierName(order.getSupplierId(), retailerId),
                    order.getItems().size(),
                    true,
                    retailerId);
        }

        if ("received".equals(currentStatus)) {
            throw new ValidationException("Cannot change status of an already received order");
        }

        if ("cancelled".equals(currentStatus) && !"pending".equals(status)) {
            throw new ValidationException("Cancelled orders can only be moved back to pending");
        }

        order.setStatus(status);

        if ("received".equals(status) && "pending".equals(currentStatus)) {
            for (PurchaseOrderItem poi : order.getItems()) {
                Item item = itemRepository.findByIdAndRetailerIdAndDeletedAtIsNull(poi.getItemId(), retailerId)
                        .orElse(null);
                if (item != null) {
                    item.setCurrentStock(item.getCurrentStock().add(poi.getQuantity()));
                    item.setLastPurchaseDate(LocalDateTime.now());
                    itemRepository.save(item);
                }
            }
        }

        PurchaseOrder updatedOrder = purchaseOrderRepository.save(order);
        Map<Long, String> itemNamesById = resolveItemNames(
                updatedOrder.getItems().stream().map(PurchaseOrderItem::getItemId).distinct().toList(),
                retailerId);
        return toDto(
                updatedOrder,
                resolveSupplierName(updatedOrder.getSupplierId(), retailerId),
                updatedOrder.getItems().size(),
                true,
                retailerId,
                itemNamesById);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderDto> getPurchaseOrdersBySupplier(Long supplierId, Long retailerId) {
        supplierRepository.findByIdAndRetailerIdAndDeletedAtIsNull(supplierId, retailerId)
                .orElseThrow(() -> new NotFoundException("Supplier not found"));

        List<PurchaseOrder> orders = purchaseOrderRepository
                .findByRetailerIdAndSupplierIdAndDeletedAtIsNullOrderByOrderDateDesc(retailerId, supplierId);

        List<Long> orderIds = orders.stream().map(PurchaseOrder::getId).toList();
        Map<Long, Integer> itemCountByOrderId = new HashMap<>();
        if (!orderIds.isEmpty()) {
            for (Object[] row : purchaseOrderItemRepository.countItemsByPurchaseOrderIds(orderIds)) {
                Long orderId = (Long) row[0];
                Number itemCount = (Number) row[1];
                itemCountByOrderId.put(orderId, itemCount.intValue());
            }
        }

        String supplierName = resolveSupplierName(supplierId, retailerId);
        return orders.stream()
                .map(o -> toDto(
                        o,
                        supplierName,
                        itemCountByOrderId.getOrDefault(o.getId(), 0),
                        false,
                        retailerId))
                .toList();
    }

    public void deletePurchaseOrder(Long id, Long retailerId) {
        PurchaseOrder order = purchaseOrderRepository.findByIdAndRetailerIdAndDeletedAtIsNull(id, retailerId)
                .orElseThrow(() -> new NotFoundException("Purchase order not found"));
        order.setDeletedAt(LocalDateTime.now());
        purchaseOrderRepository.save(order);
    }

    private PurchaseOrderDto toDto(PurchaseOrder o, String supplierName, int itemsCount, boolean includeItems,
            Long retailerId) {
        return toDto(o, supplierName, itemsCount, includeItems, retailerId, null);
    }

    private PurchaseOrderDto toDto(PurchaseOrder o, String supplierName, int itemsCount, boolean includeItems,
            Long retailerId, Map<Long, String> itemNamesById) {
        List<PurchaseOrderDto.PurchaseOrderItemDto> itemDtos = null;
        if (includeItems) {
            itemDtos = o.getItems().stream().map(poi -> {
                String itemName;
                if (itemNamesById != null) {
                    itemName = itemNamesById.getOrDefault(poi.getItemId(), "Unknown");
                } else {
                    itemName = itemRepository.findByIdAndRetailerIdAndDeletedAtIsNull(poi.getItemId(), retailerId)
                            .map(Item::getName).orElse("Unknown");
                }
                return PurchaseOrderDto.PurchaseOrderItemDto.builder()
                        .itemId(poi.getItemId())
                        .itemName(itemName)
                        .quantity(poi.getQuantity())
                        .unitPrice(poi.getUnitPrice())
                        .amount(poi.getAmount())
                        .build();
            }).toList();
        }

        BigDecimal totalAmount = orZero(o.getTotalAmount());
        BigDecimal paidAmount = orZero(o.getPaidAmount());

        return PurchaseOrderDto.builder()
                .id(o.getId())
                .supplierId(o.getSupplierId())
                .supplierName(supplierName)
                .orderDate(o.getOrderDate() != null ? o.getOrderDate().toString() : null)
                .status(o.getStatus())
                .totalAmount(totalAmount)
                .paymentStatus(o.getPaymentStatus())
                .paidAmount(paidAmount)
                .pendingAmount(totalAmount.subtract(paidAmount))
                .itemsCount(itemsCount)
                .notes(o.getNotes())
                .items(itemDtos)
                .build();
    }

    private String resolveSupplierName(Long supplierId, Long retailerId) {
        return supplierRepository.findByIdAndRetailerIdAndDeletedAtIsNull(supplierId, retailerId)
                .map(Supplier::getCompanyName)
                .orElse("Unknown");
    }

    private String resolveSupplierName(Long supplierId, Map<Long, String> supplierNamesById) {
        return supplierNamesById.getOrDefault(supplierId, "Unknown");
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
