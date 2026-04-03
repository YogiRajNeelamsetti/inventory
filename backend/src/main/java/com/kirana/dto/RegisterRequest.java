package com.kirana.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 12, max = 128, message = "Password must be between 12 and 128 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).+$", message = "Password must include uppercase, lowercase, number, and special character")
    private String password;

    @NotBlank(message = "Owner name is required")
    private String ownerName;

    @NotBlank(message = "Business name is required")
    private String businessName;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    private String address;
    private String gstNumber;
    private String businessType;
}
