package com.kirana.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PaginationInfo {
    private long total;
    private int page;
    private int limit;
    private int totalPages;
}
