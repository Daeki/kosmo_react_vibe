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
public class StockResponse {
    private String code;
    private String name;
    private Integer price;
    private Integer changePrice;
    private Double changeRate;
    private Boolean isRising;
    private List<Integer> history;

    // 기본적 분석용 데이터
    private Double per;
    private Double pbr;
    private Double eps;
    private Double bps;
    private Double undervaluationScore;
}
