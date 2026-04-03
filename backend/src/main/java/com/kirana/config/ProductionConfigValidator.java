package com.kirana.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class ProductionConfigValidator {

    private final Environment environment;

    @Value("${app.demo.enabled:false}")
    private boolean demoEnabled;

    @PostConstruct
    public void validate() {
        boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");
        if (isProd && demoEnabled) {
            throw new IllegalStateException("app.demo.enabled must be false when SPRING_PROFILES_ACTIVE=prod");
        }
    }
}
