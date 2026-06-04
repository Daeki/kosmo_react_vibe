package com.vibe.kosmo.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThemeResponse {
    private String name;
    private String type; // "THEME" (테마) or "SECTOR" (업종)
    private String description;
    private List<StockResponse> stocks;
}
