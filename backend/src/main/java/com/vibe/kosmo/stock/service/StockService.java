package com.vibe.kosmo.stock.service;

import com.vibe.kosmo.stock.dto.StockResponse;
import com.vibe.kosmo.stock.dto.ThemeResponse;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockService {

    private final KisService kisService;
    private final Map<String, StockResponse> cache = new ConcurrentHashMap<>();
    private final Map<String, Integer> closePrices = new ConcurrentHashMap<>();
    
    // 현재 활성화된 상위 10개 종목 코드 리스트 (순서 보장)
    private final List<String> activeStockCodes = new CopyOnWriteArrayList<>();

    // 저평가 주식 분석을 위한 후보 25개 우량주
    private final Map<String, String> candidateStocks = Map.ofEntries(
        Map.entry("005930", "삼성전자"),
        Map.entry("000660", "SK하이닉스"),
        Map.entry("005380", "현대차"),
        Map.entry("000270", "기아"),
        Map.entry("035420", "NAVER"),
        Map.entry("035720", "카카오"),
        Map.entry("051910", "LG화학"),
        Map.entry("006400", "삼성SDI"),
        Map.entry("068270", "셀트리온"),
        Map.entry("105560", "KB금융"),
        Map.entry("055550", "신한지주"),
        Map.entry("086790", "하나금융지주"),
        Map.entry("316140", "우리금융지주"),
        Map.entry("024110", "기업은행"),
        Map.entry("028260", "삼성물산"),
        Map.entry("066570", "LG전자"),
        Map.entry("015760", "한국전력"),
        Map.entry("005490", "POSCO홀딩스"),
        Map.entry("011200", "HMM"),
        Map.entry("003490", "대한항공"),
        Map.entry("030200", "KT"),
        Map.entry("017670", "SK텔레콤"),
        Map.entry("010950", "S-Oil"),
        Map.entry("012330", "현대모비스"),
        Map.entry("032830", "삼성생명")
    );

    // 기본적 분석으로 분석 완료된 저평가 주식 상위 10개 목록
    private final List<StockResponse> undervaluedStocks = new CopyOnWriteArrayList<>();

    @PostConstruct
    public void init() {
        log.info("주식 시뮬레이션 서비스 초기화 중...");
        // 초기화 시 KIS API 거래량 순위 연동 시도
        try {
            syncWithKisApi();
            if (activeStockCodes.isEmpty()) {
                log.warn("초기 KIS API 동기화 실패 또는 데이터 없음.");
            }
        } catch (Exception e) {
            log.error("초기 KIS API 동기화 중 에러 발생: {}", e.getMessage());
        }
    }

    /**
     * 종목별 호가 단위 가져오기
     */
    private int getStepPrice(String code) {
        if (code == null) return 100;
        return switch (code) {
            case "000660", "005380", "373220", "005490" -> 500; // 고가주
            case "035420", "068270" -> 200;                     // 중가주
            default -> 100;                                     // 삼전, 카카오, 기아, 토스 등
        };
    }

    /**
     * 전체 주식 정보 목록 반환 (상위 10개 순서 보장, 데이터가 없으면 예외 발생)
     */
    public List<StockResponse> getAllStocks() {
        if (activeStockCodes.isEmpty()) {
            throw new RuntimeException("한국투자증권 API 연동에 실패하여 실시간 주식 목록을 불러올 수 없습니다. API 키 설정 또는 원격 서버 상태를 확인해 주세요.");
        }
        
        List<StockResponse> list = new ArrayList<>();
        for (String code : activeStockCodes) {
            StockResponse s = cache.get(code);
            if (s != null) {
                list.add(s);
            }
        }
        return list;
    }

    /**
     * 특정 주식 정보 반환 (캐시에 없으면 KIS 실시간 API 단일 조회 후 동적 캐싱, 조회 실패 시 예외 발생)
     */
    public StockResponse getStock(String code) {
        StockResponse stock = cache.get(code);
        if (stock == null) {
            try {
                log.info("캐시에 없는 종목코드 {} KIS API 실시간 단일 조회 시도", code);
                Map<String, Object> data = kisService.getStockDetailWithFundamentals(code);
                if (data == null) {
                    throw new RuntimeException("한국투자증권 API로부터 종목 시세 데이터를 가져오지 못했습니다.");
                }
                
                int price = (int) data.get("price");
                int changePrice = (int) data.get("changePrice");
                double changeRate = (double) data.get("changeRate");
                boolean isRising = (boolean) data.get("isRising");
                double per = (double) data.get("per");
                double pbr = (double) data.get("pbr");
                double eps = (double) data.get("eps");
                double bps = (double) data.get("bps");

                int closePrice = isRising ? price - changePrice : price + changePrice;
                if (closePrice <= 0) closePrice = 1;
                closePrices.put(code, closePrice);

                // 7일 가상 히스토리 생성
                List<Integer> history = new ArrayList<>();
                int tempPrice = closePrice;
                Random rand = new Random();
                for (int i = 0; i < 6; i++) {
                    tempPrice = tempPrice - (rand.nextInt(5) - 2) * getStepPrice(code) * 2;
                    history.add(0, tempPrice);
                }
                history.add(price);

                String name = candidateStocks.getOrDefault(code, "종목 (" + code + ")");

                stock = StockResponse.builder()
                        .code(code)
                        .name(name)
                        .price(price)
                        .changePrice(changePrice)
                        .changeRate(changeRate)
                        .isRising(isRising)
                        .per(per)
                        .pbr(pbr)
                        .eps(eps)
                        .bps(bps)
                        .history(history)
                        .build();

                cache.put(code, stock);
                log.info("종목코드 {} 동적 캐싱 완료: {}", code, stock.getName());
            } catch (Exception e) {
                log.error("개별 종목코드 {} 실시간 조회 및 동적 캐싱 실패: {}", code, e.getMessage());
                throw new RuntimeException("해당 종목(" + code + ")의 시세를 조회할 수 없습니다. 사유: " + e.getMessage());
            }
        }
        return stock;
    }

    /**
     * 3초마다 미세 시뮬레이션 가격 변동 (캐시된 모든 종목에 적용하여 시각적 실시간 틱 효과 지원)
     */
    @Scheduled(fixedRate = 3000)
    public void simulatePriceFluctuations() {
        if (cache.isEmpty()) return;
        
        Random rand = new Random();
        for (StockResponse stock : cache.values()) {
            String code = stock.getCode();
            int step = getStepPrice(code);
            // -2, -1, 0, 1, 2 단계 변동
            int deltaSteps = rand.nextInt(5) - 2; 
            int deltaPrice = deltaSteps * step;

            if (deltaPrice == 0) continue; // 변동 없음

            int newPrice = Math.max(100, stock.getPrice() + deltaPrice);
            int closePrice = closePrices.getOrDefault(code, newPrice);
            if (closePrice <= 0) closePrice = 1;
            int changePrice = newPrice - closePrice;
            double changeRate = round((double) changePrice / closePrice * 100, 2);
            boolean isRising = changePrice >= 0;

            stock.setPrice(newPrice);
            stock.setChangePrice(Math.abs(changePrice));
            stock.setChangeRate(changeRate);
            stock.setIsRising(isRising);

            // 7일 히스토리 중 오늘 가격(마지막 요소) 업데이트
            List<Integer> history = stock.getHistory();
            if (history != null && !history.isEmpty()) {
                history.set(history.size() - 1, newPrice);
            }
        }
    }

    /**
     * 1분마다 KIS 거래량 순위 API를 호출하여 상위 10개 종목 연동 및 가격 정보 동기화
     */
    @Scheduled(fixedRate = 60000)
    public void syncWithKisApi() {
        log.info("한국투자증권 API 거래량 순위 동기화 시작...");
        try {
            List<Map<String, Object>> rankingData = kisService.getVolumeRanking();
            if (rankingData != null && !rankingData.isEmpty()) {
                List<String> newActiveCodes = new ArrayList<>();
                for (Map<String, Object> data : rankingData) {
                    String code = (String) data.get("code");
                    String name = (String) data.get("name");
                    int price = (int) data.get("price");
                    int changePrice = (int) data.get("changePrice");
                    double changeRate = (double) data.get("changeRate");
                    boolean isRising = (boolean) data.get("isRising");

                    newActiveCodes.add(code);
                    
                    int closePrice = isRising ? price - changePrice : price + changePrice;
                    if (closePrice <= 0) closePrice = 1;
                    closePrices.put(code, closePrice);

                    StockResponse stock = cache.get(code);
                    if (stock == null) {
                        // 신규 종목인 경우 히스토리 새로 생성하여 캐시 추가
                        List<Integer> history = new ArrayList<>();
                        int tempPrice = closePrice;
                        Random rand = new Random();
                        for (int i = 0; i < 6; i++) {
                            tempPrice = tempPrice - (rand.nextInt(5) - 2) * getStepPrice(code) * 2;
                            history.add(0, tempPrice);
                        }
                        history.add(price);

                        stock = StockResponse.builder()
                                .code(code)
                                .name(name)
                                .price(price)
                                .changePrice(changePrice)
                                .changeRate(changeRate)
                                .isRising(isRising)
                                .history(history)
                                .build();
                        cache.put(code, stock);
                    } else {
                        // 기존 종목인 경우 정보 갱신
                        stock.setName(name); // 이름이 다를 수 있으므로 갱신
                        stock.setPrice(price);
                        stock.setChangePrice(changePrice);
                        stock.setChangeRate(changeRate);
                        stock.setIsRising(isRising);
                        
                        List<Integer> history = stock.getHistory();
                        if (history != null && !history.isEmpty()) {
                            history.set(history.size() - 1, price);
                        }
                    }
                }
                
                // 액티브 코드 리스트 갱신
                activeStockCodes.clear();
                activeStockCodes.addAll(newActiveCodes);
                log.info("KIS 거래량 순위 상위 10개 종목 동기화 성공! 목록: {}", activeStockCodes);
            } else {
                log.warn("KIS 거래량 순위 API 데이터가 없거나 비어 있습니다. 기존 목록을 유지합니다.");
                if (activeStockCodes.isEmpty()) {
                    throw new RuntimeException("한국투자증권 API로부터 실시간 순위 주가 목록을 받아오지 못했습니다.");
                }
            }
        } catch (Exception e) {
            log.error("KIS 거래량 순위 동기화 중 오류 발생: {}", e.getMessage());
            throw new RuntimeException(e.getMessage(), e);
        }
    }

    private double round(double value, int places) {
        if (places < 0) throw new IllegalArgumentException();
        BigDecimal bd = BigDecimal.valueOf(value);
        bd = bd.setScale(places, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }

    /**
     * 테마 및 업종 데이터 조회
     */
    public List<ThemeResponse> getThemesAndSectors() {
        List<ThemeResponse> list = new ArrayList<>();

        // 1. 테마 구성
        list.add(createTheme("반도체 대장주", "THEME", "AI 반도체 및 디바이스 가치사슬 핵심 부품 제조 테마", List.of("005930", "000660")));
        list.add(createTheme("친환경 이차전지", "THEME", "전기차 모빌리티 배터리 및 핵심 소재 생산 테마", List.of("051910", "006400", "005490")));
        list.add(createTheme("인터넷 플랫폼 / AI", "THEME", "빅데이터, 광고 및 인공지능 플랫폼 기술 선도 테마", List.of("035420", "035720")));
        list.add(createTheme("고배당 금융지주", "THEME", "안정적 배당 및 자산 관리 기반의 전통 금융 지주사 테마", List.of("105560", "055550", "086790", "316140", "024110", "032830")));
        list.add(createTheme("물류 / 에너지 / 운송", "THEME", "글로벌 공급망 운송 및 친환경 에너지 유틸리티 공급 테마", List.of("015760", "003490", "011200")));
        list.add(createTheme("미래 자동차 모빌리티", "THEME", "자율주행, 미래차 완성차 및 전장 부품 제조 테마", List.of("005380", "000270", "012330")));

        // 2. 업종 구성
        list.add(createTheme("IT / 테크놀로지 업종", "SECTOR", "반도체, 모바일 기기 및 소프트웨어 개발 관련 업종", List.of("005930", "000660", "035420", "035720", "066570", "017670", "030200")));
        list.add(createTheme("금융 / 보험 서비스 업종", "SECTOR", "은행 지주, 생명보험 및 서민 금융 서비스 유관 업종", List.of("105560", "055550", "086790", "316140", "024110", "032830")));
        list.add(createTheme("중공업 / 소재 / 경기소비재 업종", "SECTOR", "화학, 철강, 배터리 소재, 완성차 및 기계 제조 관련 업종", List.of("051910", "006400", "005490", "003490", "011200", "005380", "000270", "012330", "010950")));
        list.add(createTheme("유틸리티 / 인프라 업종", "SECTOR", "국가 주요 공공재 공급 및 5G 통신망 인프라 업종", List.of("015760", "017670", "030200")));
        list.add(createTheme("바이오 / 제약 헬스케어 업종", "SECTOR", "신약 파이프라인 개발 및 글로벌 바이오시밀러 제조 업종", List.of("068270")));

        return list;
    }

    private ThemeResponse createTheme(String name, String type, String description, List<String> codes) {
        List<StockResponse> stocks = new ArrayList<>();
        for (String code : codes) {
            StockResponse stock = cache.get(code);
            if (stock == null) {
                String stockName = candidateStocks.getOrDefault(code, "종목 (" + code + ")");
                stock = StockResponse.builder()
                        .code(code)
                        .name(stockName)
                        .price(0)
                        .changePrice(0)
                        .changeRate(0.0)
                        .isRising(true)
                        .build();
            }
            stocks.add(stock);
        }
        return ThemeResponse.builder()
                .name(name)
                .type(type)
                .description(description)
                .stocks(stocks)
                .build();
    }

    /**
     * 저평가 주식 목록 반환
     */
    public List<StockResponse> getUndervaluedStocks() {
        return undervaluedStocks;
    }

    /**
     * 1시간마다 기본적 분석 기반 저평가 주식 분석 수행 (서버 시작 10초 후 첫 실행)
     */
    @Scheduled(fixedRate = 3600000, initialDelay = 10000)
    public void syncUndervaluedStocks() {
        log.info("기본적 분석 기반 저평가 주식 분석 시작...");
        List<StockResponse> analyzedList = new ArrayList<>();
        
        for (Map.Entry<String, String> entry : candidateStocks.entrySet()) {
            String code = entry.getKey();
            String name = entry.getValue();
            try {
                // KIS Sandbox API 2 TPS limit 회피를 위해 1.2초 대기
                Thread.sleep(1200);
                
                Map<String, Object> data = kisService.getStockDetailWithFundamentals(code);
                if (data != null) {
                    int price = (int) data.get("price");
                    int changePrice = (int) data.get("changePrice");
                    double changeRate = (double) data.get("changeRate");
                    boolean isRising = (boolean) data.get("isRising");
                    double per = (double) data.get("per");
                    double pbr = (double) data.get("pbr");
                    double eps = (double) data.get("eps");
                    double bps = (double) data.get("bps");
                    
                    // 저평가 지수 계산: PER * PBR (둘 다 양수일 때만, 그 외는 최하위 순위인 9999.0)
                    double score = (per > 0 && pbr > 0) ? per * pbr : 9999.0;
                    
                    int closePrice = isRising ? price - changePrice : price + changePrice;
                    if (closePrice <= 0) closePrice = 1;
                    
                    // 7일 가상 히스토리 생성 (상세 페이지에서 차트 그리기 위함)
                    List<Integer> history = new ArrayList<>();
                    int tempPrice = closePrice;
                    Random rand = new Random();
                    for (int i = 0; i < 6; i++) {
                        tempPrice = tempPrice - (rand.nextInt(5) - 2) * getStepPrice(code) * 2;
                        history.add(0, tempPrice);
                    }
                    history.add(price);
                    
                    StockResponse stock = StockResponse.builder()
                            .code(code)
                            .name(name)
                            .price(price)
                            .changePrice(changePrice)
                            .changeRate(changeRate)
                            .isRising(isRising)
                            .per(per)
                            .pbr(pbr)
                            .eps(eps)
                            .bps(bps)
                            .undervaluationScore(score)
                            .history(history)
                            .build();
                    
                    analyzedList.add(stock);
                    
                    // 기존 캐시에도 주가 정보 등록 (상세 페이지 조회 시 KIS 재호출 방지용)
                    cache.put(code, stock);
                    closePrices.put(code, closePrice);
                    log.info("저평가 후보 분석 완료: {} ({}): PER={}, PBR={}, Score={}", name, code, per, pbr, score);
                }
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                log.warn("저평가 주식 분석 중 인터럽트 발생");
                break;
            } catch (Exception e) {
                log.error("저평가 후보 분석 실패 (code={}): {}", code, e.getMessage());
            }
        }
        
        if (!analyzedList.isEmpty()) {
            // 저평가 점수(Score) 오름차순으로 정렬하여 상위 10개 추출
            analyzedList.sort(Comparator.comparingDouble(StockResponse::getUndervaluationScore));
            List<StockResponse> top10 = analyzedList.subList(0, Math.min(10, analyzedList.size()));
            
            undervaluedStocks.clear();
            undervaluedStocks.addAll(top10);
            log.info("기본적 분석 완료! 상위 10개 저평가 종목 선정 완료: {}", 
                     undervaluedStocks.stream().map(s -> s.getName() + "(Score:" + s.getUndervaluationScore() + ")").toList());
        } else {
            log.warn("저평가 주식 분석 결과가 비어 있습니다.");
        }
    }
}
