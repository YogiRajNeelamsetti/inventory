// package com.kirana.mlDto;
//
// import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
// import java.util.List;
// import lombok.Data;
//
// @Data
// @JsonIgnoreProperties(ignoreUnknown = true)
// public class ForecastResponse {
//   private List<ForecastPoint> forecast;
//   private Double totalPredicted;
//   private Double avgDaily;
//
//   @Data
//   @JsonIgnoreProperties(ignoreUnknown = true)
//   public static class ForecastPoint{
//     private String ds;
//     private Double yhat;
//     private Double yhatLower;
//     private Double yhatUpper;
//   }
//
// }

package com.kirana.mlDto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ForecastResponse {

    private List<ForecastPoint> forecast;

    @JsonProperty("total_predicted")   // Python sends "total_predicted"
    private Double totalPredicted;

    @JsonProperty("avg_daily")         // Python sends "avg_daily"
    private Double avgDaily;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ForecastPoint {

        private String ds;

        private Double yhat;

        @JsonProperty("yhat_lower")    // Python sends "yhat_lower"
        private Double yhatLower;

        @JsonProperty("yhat_upper")    // Python sends "yhat_upper"
        private Double yhatUpper;
    }
}
