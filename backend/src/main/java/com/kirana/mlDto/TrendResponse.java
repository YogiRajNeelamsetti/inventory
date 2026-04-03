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
// public class TrendResponse {
//
//   private List<Trend> trends;
//
//
//
//   @Data
//   @JsonIgnoreProperties(ignoreUnknown=true)
//   public static class Trend {
//
//     private String category;
//     private String trend;
//     private Double growthRate;
//     private Double totalSales;
//
//   }
//
//
//
//
// }


// src/main/java/com/kirana/mlDto/TrendResponse.java
package com.kirana.mlDto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TrendResponse {

    private List<Trend> trends;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Trend {

        private String category;
        private String trend;

        @JsonProperty("growth_rate")
        private Double growthRate;

        @JsonProperty("total_sales")
        private Double totalSales;
    }
}
