package com.kirana.mlDto;


import lombok.Data;



@Data
public class ItemRecommendationDecision {

    private Long itemId;
    private String itemName;
    private String category;

    private double stock;

    private String action;
    private String message;
}
