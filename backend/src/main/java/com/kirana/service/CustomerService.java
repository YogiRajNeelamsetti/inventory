package com.kirana.service;

import com.kirana.dto.CustomerDto;
import com.kirana.entity.Customer;
import com.kirana.exception.NotFoundException;
import com.kirana.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    public List<CustomerDto> getCustomers(Long retailerId) {
        return getCustomers(retailerId, null);
    }

    public List<CustomerDto> getCustomers(Long retailerId, String search) {
        List<Customer> customers;
        if (search != null && !search.trim().isEmpty()) {
            customers = customerRepository.searchCustomers(retailerId, search.trim());
        } else {
            customers = customerRepository.findByRetailerIdAndDeletedAtIsNull(retailerId);
        }
        return customers.stream().map(this::toDto).toList();
    }

    public Map<String, Object> getCustomers(Long retailerId, String search, int page, int limit) {
        int normalizedPage = Math.max(1, page);
        int normalizedLimit = normalizeLimit(limit);

        Page<Customer> customersPage;
        if (search != null && !search.trim().isEmpty()) {
            customersPage = customerRepository.searchCustomers(
                    retailerId,
                    search.trim(),
                    PageRequest.of(normalizedPage - 1, normalizedLimit));
        } else {
            customersPage = customerRepository.findByRetailerIdAndDeletedAtIsNull(
                    retailerId,
                    PageRequest.of(normalizedPage - 1, normalizedLimit));
        }

        List<CustomerDto> customers = customersPage.getContent().stream().map(this::toDto).toList();

        return Map.of(
                "customers", customers,
                "pagination", Map.of(
                        "total", customersPage.getTotalElements(),
                        "page", normalizedPage,
                        "limit", normalizedLimit,
                        "total_pages", Math.max(customersPage.getTotalPages(), 1)));
    }

    public CustomerDto getCustomerById(Long id, Long retailerId) {
        Customer customer = customerRepository.findByIdAndRetailerIdAndDeletedAtIsNull(id, retailerId)
                .orElseThrow(() -> new NotFoundException("Customer not found"));
        return toDto(customer);
    }

    public List<CustomerDto> searchByPhone(String phone, Long retailerId) {
        return customerRepository.findByRetailerIdAndDeletedAtIsNull(retailerId).stream()
                .filter(c -> c.getPhoneNumber().contains(phone))
                .map(this::toDto)
                .toList();
    }

    public CustomerDto addCustomer(CustomerDto dto, Long retailerId) {
        Customer customer = Customer.builder()
                .retailerId(retailerId)
                .name(dto.getName())
                .phoneNumber(dto.getPhoneNumber())
                .email(dto.getEmail())
                .address(dto.getAddress())
                .build();
        return toDto(customerRepository.save(customer));
    }

    public CustomerDto updateCustomer(Long id, CustomerDto dto, Long retailerId) {
        Customer customer = customerRepository.findByIdAndRetailerIdAndDeletedAtIsNull(id, retailerId)
                .orElseThrow(() -> new NotFoundException("Customer not found"));
        customer.setName(dto.getName());
        customer.setPhoneNumber(dto.getPhoneNumber());
        customer.setEmail(dto.getEmail());
        customer.setAddress(dto.getAddress());
        return toDto(customerRepository.save(customer));
    }

    public void deleteCustomer(Long id, Long retailerId) {
        Customer customer = customerRepository.findByIdAndRetailerIdAndDeletedAtIsNull(id, retailerId)
                .orElseThrow(() -> new NotFoundException("Customer not found"));
        customer.setDeletedAt(LocalDateTime.now());
        customerRepository.save(customer);
    }

    private CustomerDto toDto(Customer c) {
        return CustomerDto.builder()
                .id(c.getId())
                .name(c.getName())
                .phoneNumber(c.getPhoneNumber())
                .email(c.getEmail())
                .address(c.getAddress())
                .totalPurchases(c.getTotalPurchases())
                .build();
    }

    private int normalizeLimit(int limit) {
        return Math.min(Math.max(1, limit), 200);
    }
}
