package com.vibe.kosmo.stock.controller;

import com.vibe.kosmo.stock.dto.StockResponse;
import com.vibe.kosmo.stock.dto.ThemeResponse;
import com.vibe.kosmo.stock.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    /**
     * 전체 인기 주식 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<StockResponse>> getAllStocks() {
        return ResponseEntity.ok(stockService.getAllStocks());
    }

    /**
     * 테마 및 업종 전체 목록 조회
     */
    @GetMapping("/themes")
    public ResponseEntity<List<ThemeResponse>> getThemesAndSectors() {
        return ResponseEntity.ok(stockService.getThemesAndSectors());
    }

    /**
     * 기본적 분석 기반 저평가 우량주 10선 조회
     */
    @GetMapping("/undervalued")
    public ResponseEntity<List<StockResponse>> getUndervaluedStocks() {
        return ResponseEntity.ok(stockService.getUndervaluedStocks());
    }

    /**
     * 개별 주식 상세 정보 조회
     */
    @GetMapping("/{code}")
    public ResponseEntity<StockResponse> getStockByCode(@PathVariable("code") String code) {
        StockResponse stock = stockService.getStock(code);
        if (stock == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(stock);
    }
}
