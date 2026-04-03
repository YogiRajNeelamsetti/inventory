// package com.kirana.mlDto;
//
// import java.util.List;
//
// import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
//
// import lombok.Data;
//
// @Data
// @JsonIgnoreProperties(ignoreUnknown = true)
// public class RecommendationResponse {
//
//   private List<Recommendation> recommendations;
//
//
//   @Data
//   @JsonIgnoreProperties(ignoreUnknown = true)
//   public static  class Recommendation{
//     private Long itemId;
//     private String itemName;
//     private String category;
//     private String action;
//     private String reason;
//     private Double growthRate;
//     private Double profitMargin;
//     private Integer currentStock;
//     private Double score;
//   }

  
// }


package com.kirana.mlDto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class RecommendationResponse {

    private List<Recommendation> recommendations;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Recommendation {

        @JsonProperty("item_id")
        private Long itemId;

        @JsonProperty("item_name")
        private String itemName;

        private String category;
        private String action;
        private String reason;

        @JsonProperty("growth_rate")
        private Double growthRate;

        @JsonProperty("profit_margin")
        private Double profitMargin;

        @JsonProperty("current_stock")
        private Integer currentStock;

        private Double score;
    }
}
