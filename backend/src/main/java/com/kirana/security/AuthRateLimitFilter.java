package com.kirana.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kirana.dto.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> LIMITED_AUTH_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/google");

    @Value("${app.auth.rate-limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${app.auth.rate-limit.max-requests:15}")
    private int maxRequests;

    @Value("${app.auth.rate-limit.window-seconds:60}")
    private int windowSeconds;

    private final ConcurrentHashMap<String, Deque<Long>> requestTimestampsByKey = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!rateLimitEnabled) {
            return true;
        }
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        return !LIMITED_AUTH_PATHS.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String requestKey = resolveClientIp(request) + ":" + request.getRequestURI();
        long now = System.currentTimeMillis();
        long windowStart = now - Math.max(1, windowSeconds) * 1000L;

        Deque<Long> timestamps = requestTimestampsByKey.computeIfAbsent(requestKey, key -> new ArrayDeque<>());

        boolean limited;
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
                timestamps.pollFirst();
            }

            limited = timestamps.size() >= Math.max(1, maxRequests);
            if (!limited) {
                timestamps.addLast(now);
            }

            if (timestamps.isEmpty()) {
                requestTimestampsByKey.remove(requestKey, timestamps);
            }
        }

        if (limited) {
            writeRateLimitResponse(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeRateLimitResponse(HttpServletResponse response) throws IOException {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ApiResponse<Void> body = ApiResponse.error(
                "RATE_LIMITED",
                "Too many authentication attempts. Please try again shortly.");
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}