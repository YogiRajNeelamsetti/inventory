package com.kirana.service;

import com.kirana.dto.AuthRequest;
import com.kirana.exception.UnauthorizedException;
import com.kirana.repository.RetailerRepository;
import com.kirana.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private RetailerRepository retailerRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(retailerRepository, jwtUtil, passwordEncoder);
    }

    @Test
    void demoLoginThrowsWhenDisabled() {
        ReflectionTestUtils.setField(authService, "demoEnabled", false);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> authService.demoLogin());

        assertTrue(ex.getMessage().contains("disabled"));
    }

    @Test
    void loginLocksAfterConfiguredFailedAttempts() {
        String identifier = "locked@example.com";
        AuthRequest request = new AuthRequest(identifier, "wrong-password");

        ReflectionTestUtils.setField(authService, "lockoutEnabled", true);
        ReflectionTestUtils.setField(authService, "lockoutMaxFailedAttempts", 2);
        ReflectionTestUtils.setField(authService, "lockoutDurationMinutes", 5);

        when(retailerRepository.findByEmailAndDeletedAtIsNull(identifier)).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class, () -> authService.login(request));
        assertThrows(UnauthorizedException.class, () -> authService.login(request));

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> authService.login(request));
        assertTrue(ex.getMessage().contains("Too many failed attempts"));
    }
}
