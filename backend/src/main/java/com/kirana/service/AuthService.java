package com.kirana.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.kirana.dto.AuthRequest;
import com.kirana.dto.AuthResponse;
import com.kirana.dto.GoogleAuthRequest;
import com.kirana.dto.RegisterRequest;
import com.kirana.entity.Retailer;
import com.kirana.exception.ConflictException;
import com.kirana.exception.UnauthorizedException;
import com.kirana.repository.RetailerRepository;
import com.kirana.security.JwtUtil;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final RetailerRepository retailerRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    @Value("${app.demo.enabled:false}")
    private boolean demoEnabled;

    @Value("${app.demo.email:}")
    private String demoEmail;

    @Value("${app.auth.lockout.enabled:true}")
    private boolean lockoutEnabled;

    @Value("${app.auth.lockout.max-failed-attempts:5}")
    private int lockoutMaxFailedAttempts;

    @Value("${app.auth.lockout.duration-minutes:15}")
    private int lockoutDurationMinutes;

    private GoogleIdTokenVerifier googleVerifier;
    private final ConcurrentHashMap<String, LoginAttemptState> loginAttemptState = new ConcurrentHashMap<>();

    @PostConstruct
    void initGoogleVerifier() {
        if (googleClientId != null && !googleClientId.isBlank()) {
            googleVerifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
            log.info("Google OAuth configured for client: {}...{}",
                    googleClientId.substring(0, Math.min(8, googleClientId.length())),
                    googleClientId.substring(Math.max(0, googleClientId.length() - 12)));
        } else {
            log.warn("Google OAuth disabled — GOOGLE_CLIENT_ID not set");
        }
    }

    public AuthResponse login(AuthRequest request) {
        String identifier = normalizeIdentifier(request.getEmail());
        ensureIdentifierNotLocked(identifier);

        Optional<Retailer> retailerOptional;
        if (identifier.matches("^\\d{10,15}$")) {
            retailerOptional = retailerRepository.findByPhoneNumberAndDeletedAtIsNull(identifier);
        } else {
            retailerOptional = retailerRepository.findByEmailAndDeletedAtIsNull(identifier);
        }

        Retailer retailer = retailerOptional.orElse(null);
        if (retailer == null) {
            recordFailedLoginAttempt(identifier);
            throw new UnauthorizedException("Invalid credentials");
        }

        if (retailer.getPasswordHash() == null ||
                !passwordEncoder.matches(request.getPassword(), retailer.getPasswordHash())) {
            recordFailedLoginAttempt(identifier);
            throw new UnauthorizedException("Invalid credentials");
        }

        clearLoginAttemptState(identifier);

        return buildAuthResponse(retailer);
    }

    public AuthResponse register(RegisterRequest request) {
        if (retailerRepository.findByEmailAndDeletedAtIsNull(request.getEmail()).isPresent()) {
            throw new ConflictException("Email already registered");
        }
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank() &&
                retailerRepository.findByPhoneNumberAndDeletedAtIsNull(request.getPhoneNumber()).isPresent()) {
            throw new ConflictException("Phone number already registered");
        }

        Retailer retailer = Retailer.builder()
                .businessName(request.getBusinessName())
                .ownerName(request.getOwnerName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .gstNumber(request.getGstNumber())
                .businessType(request.getBusinessType())
                .authProvider("local")
                .isActive(true)
                .build();

        retailer = retailerRepository.save(retailer);
        return buildAuthResponse(retailer);
    }

    @Transactional
    public AuthResponse googleLogin(GoogleAuthRequest request) {
        if (googleVerifier == null) {
            throw new UnauthorizedException("Google OAuth is not configured on this server");
        }

        GoogleIdToken idToken;
        try {
            idToken = googleVerifier.verify(request.getIdToken());
        } catch (Exception e) {
            log.warn("Google token verification failed: {}", e.getMessage());
            throw new UnauthorizedException("Invalid Google token");
        }

        if (idToken == null) {
            throw new UnauthorizedException("Invalid or expired Google token");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        if (email == null || email.isBlank()) {
            throw new UnauthorizedException("Google account has no email");
        }
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new UnauthorizedException("Google email not verified");
        }

        String name = (String) payload.get("name");
        if (name == null || name.isBlank()) {
            name = email.split("@")[0];
        }

        Optional<Retailer> existing = retailerRepository.findByEmailAndDeletedAtIsNull(email);
        Retailer retailer;

        if (existing.isPresent()) {
            retailer = existing.get();
            if (!Boolean.TRUE.equals(retailer.getIsActive())) {
                throw new UnauthorizedException("Account is suspended");
            }
        } else {
            retailer = Retailer.builder()
                    .email(email)
                    .ownerName(name)
                    .businessName(name + "'s Business")
                    .authProvider("google")
                    .isActive(true)
                    .build();
            retailer = retailerRepository.save(retailer);
            log.info("Auto-created account for Google user: {}", email);
        }

        return buildAuthResponse(retailer);
    }

    public AuthResponse demoLogin() {
        if (!demoEnabled) {
            throw new UnauthorizedException("Demo login is disabled");
        }

        if (demoEmail == null || demoEmail.isBlank()) {
            throw new UnauthorizedException("Demo login is not configured");
        }

        Retailer retailer = retailerRepository.findByEmailAndDeletedAtIsNull(demoEmail.trim())
                .orElseThrow(() -> new UnauthorizedException("No retailer account available for demo login"));

        if (!Boolean.TRUE.equals(retailer.getIsActive())) {
            throw new UnauthorizedException("Demo retailer account is inactive");
        }

        return buildAuthResponse(retailer);
    }

    private AuthResponse buildAuthResponse(Retailer retailer) {
        String token = jwtUtil.generateToken(retailer.getId(), retailer.getEmail());

        return AuthResponse.builder()
                .token(token)
                .retailerId(retailer.getId())
                .businessName(retailer.getBusinessName())
                .ownerName(retailer.getOwnerName())
                .email(retailer.getEmail())
                .build();
    }

    private void ensureIdentifierNotLocked(String identifier) {
        if (!lockoutEnabled) {
            return;
        }

        LoginAttemptState state = loginAttemptState.get(identifier);
        if (state == null) {
            return;
        }

        Instant now = Instant.now();
        synchronized (state) {
            if (state.lockedUntil == null) {
                return;
            }
            if (now.isBefore(state.lockedUntil)) {
                throw new UnauthorizedException("Too many failed attempts. Try again later.");
            }
        }

        loginAttemptState.remove(identifier, state);
    }

    private void recordFailedLoginAttempt(String identifier) {
        if (!lockoutEnabled) {
            return;
        }

        LoginAttemptState state = loginAttemptState.computeIfAbsent(identifier, key -> new LoginAttemptState());
        Instant now = Instant.now();
        synchronized (state) {
            if (state.lockedUntil != null && now.isAfter(state.lockedUntil)) {
                state.failedAttempts = 0;
                state.lockedUntil = null;
            }

            state.failedAttempts += 1;
            if (state.failedAttempts >= Math.max(1, lockoutMaxFailedAttempts)) {
                state.failedAttempts = 0;
                state.lockedUntil = now.plusSeconds(Math.max(1, lockoutDurationMinutes) * 60L);
            }
        }
    }

    private void clearLoginAttemptState(String identifier) {
        if (lockoutEnabled) {
            loginAttemptState.remove(identifier);
        }
    }

    private String normalizeIdentifier(String identifier) {
        return identifier == null ? "" : identifier.trim().toLowerCase();
    }

    private static final class LoginAttemptState {
        private int failedAttempts;
        private Instant lockedUntil;
    }
}
