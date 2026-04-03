package com.kirana.security;

import com.kirana.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;

public final class TenantContext {

    private TenantContext() {}

    public static Long getRetailerId(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Long)) {
            throw new UnauthorizedException("Authentication required");
        }
        return (Long) auth.getPrincipal();
    }
}
