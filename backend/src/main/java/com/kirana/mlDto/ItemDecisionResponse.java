package com.kirana.mlDto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class ItemDecisionResponse {

    private Long itemId;
    private String itemName;

    private double dailySale;
    private double stock;
    private double daysLeft;

    private String action;
    private String message;
}
