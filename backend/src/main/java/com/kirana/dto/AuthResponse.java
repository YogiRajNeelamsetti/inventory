package com.kirana.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private Long retailerId;
    private String businessName;
    private String ownerName;
    private String email;
}
