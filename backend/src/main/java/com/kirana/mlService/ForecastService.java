package com.kirana.mlService;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import org.springframework.beans.factory.annotation.Value;
import com.kirana.entity.Item;
import com.kirana.mlDto.ForecastResponse;
import com.kirana.mlDto.RecommendationResponse;
import com.kirana.mlDto.ItemRecommendationDecision;
import com.kirana.mlDto.TrendResponse;
import com.kirana.repository.ItemRepository;
import com.kirana.mlDto.ItemDecisionResponse;
import com.kirana.mlDto.CategoryTrendDecision;
import java.util.List;
import java.util.ArrayList;

@Service
public class ForecastService {

    private final ItemRepository itemRepository;
    @Value("${ml.service.url}")
    private final String mlServiceUrl;
    private final RestTemplate restTemplate;

    public ForecastService(
            ItemRepository itemRepository,
            RestTemplate restTemplate,
            @Value("${ml.service.url}") String mlServiceUrl) {
        this.itemRepository = itemRepository;
        this.restTemplate = restTemplate;
        this.mlServiceUrl = mlServiceUrl;
    }

    public ItemDecisionResponse getItemForecast(long itemId, int days, long retailerId) {

        Item item = itemRepository
                .findByIdAndRetailerIdAndDeletedAtIsNull(itemId, retailerId)
                .orElseThrow(() -> new RuntimeException("Item is not found or unauthorized"));

        try {
            String url = mlServiceUrl + "/forecast/item/" + item.getId()
                    + "?days=" + days
                    + "&retailer_id=" + item.getRetailerId();

            // 1. Call ML (same as before)
            ForecastResponse forecast = restTemplate.getForObject(url, ForecastResponse.class);

            // 2. Extract ML output
            double avgDaily = forecast.getAvgDaily();
            double stock = item.getCurrentStock().doubleValue();

            // 3. Build decision
            ItemDecisionResponse res = new ItemDecisionResponse();

            res.setItemId(item.getId());
            res.setItemName(item.getName());
            double dailySale = Math.round(avgDaily * 100.0) / 100.0;
            res.setDailySale(dailySale);
            res.setStock(stock);

            // Edge case
            if (avgDaily <= 0.01) {
                res.setDaysLeft(0);
                res.setAction("NO_DATA");
                res.setMessage("Not enough sales data yet");
                return res;
            }

            double daysLeft = stock / avgDaily;
            res.setDaysLeft(Math.round(daysLeft * 10.0) / 10.0);

            // Decision logic
            if (stock == 0) {
                res.setAction("BUY");
                res.setMessage("Out of stock - Reorder now");
            } else if (daysLeft < 3) {
                res.setAction("BUY");
                res.setMessage("Stock may run out in 2-3 days - Reorder now");
            } else if (daysLeft <= 7) {
                res.setAction("WATCH");
                res.setMessage("Stock is dropping - Monitor closely");
            } else {
                res.setAction("OK");
                res.setMessage("Stock level is healthy");
            }

            return res;

        } catch (Exception e) {
            throw new RuntimeException("ML service unavailable: " + e.getMessage());
        }
    }

    public List<ItemRecommendationDecision> getRecommendations(Long retailerId) {

        try {
            String url = mlServiceUrl + "/recommendations/" + retailerId;

            RecommendationResponse response = restTemplate.getForObject(url, RecommendationResponse.class);

            if (response == null || response.getRecommendations() == null) {
                return List.of();
            }

            List<ItemRecommendationDecision> result = new ArrayList<>();

            for (RecommendationResponse.Recommendation r : response.getRecommendations()) {

                Item item = itemRepository.findByIdAndRetailerIdAndDeletedAtIsNull(r.getItemId(), retailerId)
                        .orElse(null);

                if (item == null)
                    continue;

                ItemRecommendationDecision decision = new ItemRecommendationDecision();

                decision.setItemId(r.getItemId());
                decision.setItemName(r.getItemName());
                decision.setCategory(r.getCategory());

                double stock = item.getCurrentStock() != null
                        ? item.getCurrentStock().doubleValue()
                        : 0;

                double minStockThreshold = item.getMinStockThreshold() != null
                        ? item.getMinStockThreshold().doubleValue()
                        : 0;

                double reorderPoint = item.getReorderPoint() != null
                        ? item.getReorderPoint().doubleValue()
                        : minStockThreshold;

                double lowStockCutoff = Math.max(minStockThreshold, reorderPoint);

                decision.setStock(stock);

                // Priority 1: stock health alignment with forecast
                if (stock <= 0) {
                    decision.setAction("BUY");
                    decision.setMessage("Out of stock - Reorder now");
                } else if (lowStockCutoff > 0 && stock <= lowStockCutoff) {
                    decision.setAction("WATCH");
                    decision.setMessage("Low stock - Reorder soon");
                }
                // Priority 2: ML signal for healthy stock items
                else if ("Strong Buy".equalsIgnoreCase(r.getAction())) {
                    decision.setAction("BUY");
                    decision.setMessage("Demand is rising - Increase stock");
                } else if ("Consider Buying".equalsIgnoreCase(r.getAction())) {
                    decision.setAction("WATCH");
                    decision.setMessage("Consider increasing stock");
                } else if ("Reduce Stock".equalsIgnoreCase(r.getAction())) {
                    decision.setAction("REDUCE");
                    decision.setMessage("Demand is declining - Reduce stock");
                } else {
                    decision.setAction("OK");
                    decision.setMessage("Stable demand");
                }

                result.add(decision);
            }

            return result;

        } catch (Exception e) {
            throw new RuntimeException("ml service unavailable " + e.getMessage());
        }
    }

    public List<CategoryTrendDecision> getTrends(Long retailerId) {

        try {
            String url = mlServiceUrl + "/trends/" + retailerId;

            TrendResponse response = restTemplate.getForObject(url, TrendResponse.class);

            List<CategoryTrendDecision> result = new ArrayList<>();

            for (TrendResponse.Trend t : response.getTrends()) {

                CategoryTrendDecision decision = new CategoryTrendDecision();

                decision.setCategory(t.getCategory());
                decision.setGrowthRate(t.getGrowthRate());

                if ("Rising".equalsIgnoreCase(t.getTrend())) {
                    decision.setTrend("RISING");
                    decision.setMessage("Demand is increasing - Keep higher stock");
                } else if ("Falling".equalsIgnoreCase(t.getTrend())) {
                    decision.setTrend("FALLING");
                    decision.setMessage("Demand is decreasing - Plan carefully");
                } else {
                    decision.setTrend("STABLE");
                    decision.setMessage("Demand is stable");
                }

                result.add(decision);
            }

            return result;

        } catch (Exception e) {
            throw new RuntimeException("ml service unavailable " + e.getMessage());
        }
    }

}
