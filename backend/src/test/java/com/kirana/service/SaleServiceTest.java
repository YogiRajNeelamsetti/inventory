package com.kirana.service;

import com.kirana.entity.InventoryTransaction;
import com.kirana.entity.Item;
import com.kirana.entity.Sale;
import com.kirana.entity.SaleItem;
import com.kirana.repository.CustomerRepository;
import com.kirana.repository.InventoryTransactionRepository;
import com.kirana.repository.ItemRepository;
import com.kirana.repository.SaleItemRepository;
import com.kirana.repository.SaleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private SaleItemRepository saleItemRepository;

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private InventoryTransactionRepository inventoryTransactionRepository;

    @InjectMocks
    private SaleService saleService;

    @Test
    void deleteSaleRestoresStockAndWritesReversalTransaction() {
        Long retailerId = 1L;
        Long saleId = 101L;
        Long itemId = 77L;

        Sale sale = Sale.builder()
                .id(saleId)
                .retailerId(retailerId)
                .build();

        SaleItem saleItem = SaleItem.builder()
                .sale(sale)
                .itemId(itemId)
                .quantity(new BigDecimal("2.00"))
                .build();
        sale.getItems().add(saleItem);

        Item item = Item.builder()
                .id(itemId)
                .retailerId(retailerId)
                .currentStock(new BigDecimal("8.00"))
                .build();

        when(saleRepository.findByIdAndRetailerIdAndDeletedAtIsNull(saleId, retailerId)).thenReturn(Optional.of(sale));
        when(itemRepository.findByIdAndRetailerIdAndDeletedAtIsNullForUpdate(itemId, retailerId))
                .thenReturn(Optional.of(item));

        saleService.deleteSale(saleId, retailerId);

        assertEquals(0, item.getCurrentStock().compareTo(new BigDecimal("10.00")));
        assertNotNull(sale.getDeletedAt());

        verify(itemRepository).save(item);
        verify(saleRepository).save(sale);

        ArgumentCaptor<InventoryTransaction> transactionCaptor = ArgumentCaptor.forClass(InventoryTransaction.class);
        verify(inventoryTransactionRepository).save(transactionCaptor.capture());

        InventoryTransaction transaction = transactionCaptor.getValue();
        assertEquals("SALE_REVERSAL", transaction.getTransactionType());
        assertEquals(saleId, transaction.getReferenceId());
        assertEquals(0, transaction.getQuantity().compareTo(new BigDecimal("2.00")));
        assertEquals(0, transaction.getPreviousStock().compareTo(new BigDecimal("8.00")));
        assertEquals(0, transaction.getNewStock().compareTo(new BigDecimal("10.00")));
    }
}
