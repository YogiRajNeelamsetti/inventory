package com.kirana.mlDto;

import lombok.Data;

@Data
public class CategoryTrendDecision {

    private String category;

    private String trend;   // RISING / FALLING / STABLE
    private double growthRate;

    private String message;
}
