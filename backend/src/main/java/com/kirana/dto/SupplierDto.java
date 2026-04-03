package com.kirana.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SupplierDto {
    private Long id;

    @NotBlank(message = "Company name is required")
    private String companyName;

    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String gstNumber;
}
