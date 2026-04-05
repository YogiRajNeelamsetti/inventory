package com.kirana.mlController;

import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.kirana.security.TenantContext;

import com.kirana.dto.ApiResponse;
import com.kirana.mlDto.ItemDecisionResponse;
import com.kirana.mlDto.ItemRecommendationDecision;
import com.kirana.mlDto.CategoryTrendDecision;
import com.kirana.mlService.ForecastService;
import java.util.List;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/forecast")
@RequiredArgsConstructor
public class ForecastController {

  private final ForecastService forecastService;

  @GetMapping("/item/{itemId}")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getItemForecast(
      @PathVariable Long itemId,
      @RequestParam(defaultValue = "30") int days,
      Authentication auth) {
    Long retailerId = TenantContext.getRetailerId(auth);
    ItemDecisionResponse response = forecastService.getItemForecast(itemId, days, retailerId);
    return ResponseEntity.ok(ApiResponse.success(Map.of("decision", response)));
  }

  @GetMapping("/recommendations")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getRecommendations(
      Authentication auth) {
    Long retailerId = TenantContext.getRetailerId(auth);
    List<ItemRecommendationDecision> response = forecastService.getRecommendations(retailerId);
    return ResponseEntity.ok(ApiResponse.success(Map.of("recommendations", response)));
  }

  @GetMapping("/trends")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getTrends(
      Authentication auth) {
    Long retailerId = TenantContext.getRetailerId(auth);
    List<CategoryTrendDecision> response = forecastService.getTrends(retailerId);
    return ResponseEntity.ok(ApiResponse.success(Map.of("trends", response)));
  }

}
