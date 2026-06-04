package com.vibe.kosmo.stock.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibe.kosmo.global.config.KisConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class KisService {

    private final KisConfig kisConfig;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String accessToken = null;
    private long tokenExpiredTime = 0;
    private final String tokenFilePath = System.getProperty("java.io.tmpdir") + java.io.File.separator + "kis_token.json";

    /**
     * 한국투자증권 Access Token 발급 및 반환 (캐싱 적용)
     */
    public synchronized String getAccessToken() {
        // 메모리에 없으면 디스크에서 로드 시도
        if (accessToken == null) {
            loadTokenFromDisk();
        }
        
        // 만료시간 1분 전이거나 토큰이 없으면 새로 갱신
        if (accessToken == null || System.currentTimeMillis() >= tokenExpiredTime - 60000) {
            fetchNewAccessToken();
        }
        return accessToken;
    }

    private void loadTokenFromDisk() {
        try {
            java.io.File file = new java.io.File(tokenFilePath);
            if (file.exists()) {
                JsonNode root = objectMapper.readTree(file);
                String token = root.path("access_token").asText();
                long expiredTime = root.path("token_expired_time").asLong(0);

                // 만료시간 1분 전보다 많이 남았으면 사용
                if (token != null && !token.isEmpty() && System.currentTimeMillis() < expiredTime - 60000) {
                    this.accessToken = token;
                    this.tokenExpiredTime = expiredTime;
                    log.info("디스크 캐시로부터 KIS Access Token 로드 성공. 만료 예정: {}", new java.util.Date(this.tokenExpiredTime));
                }
            }
        } catch (Exception e) {
            log.warn("디스크 캐시 토큰 로드 실패: {}", e.getMessage());
        }
    }

    private void saveTokenToDisk(String token, long expiredTime) {
        try {
            java.io.File file = new java.io.File(tokenFilePath);
            Map<String, Object> data = new HashMap<>();
            data.put("access_token", token);
            data.put("token_expired_time", expiredTime);

            objectMapper.writeValue(file, data);
            log.info("KIS Access Token 디스크 캐시에 저장 완료: {}", tokenFilePath);
        } catch (Exception e) {
            log.warn("디스크 캐시 토큰 저장 실패: {}", e.getMessage());
        }
    }

    private void fetchNewAccessToken() {
        try {
            String url = kisConfig.getBaseUrl() + "/oauth2/tokenP";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = new HashMap<>();
            body.put("grant_type", "client_credentials");
            body.put("appkey", kisConfig.getAppKey());
            body.put("appsecret", kisConfig.getAppSecret());

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                this.accessToken = root.path("access_token").asText();
                long expiresIn = root.path("expires_in").asLong(86400); // 초 단위 (기본 24시간)
                this.tokenExpiredTime = System.currentTimeMillis() + (expiresIn * 1000);
                log.info("KIS API Access Token 신규 발급 성공. 만료 예정: {} (expires_in: {}s)", new java.util.Date(this.tokenExpiredTime), expiresIn);
                
                // 신규 발급 시 디스크 캐시 갱신
                saveTokenToDisk(this.accessToken, this.tokenExpiredTime);
            } else {
                log.error("KIS API Access Token 발급 실패: {}", response.getStatusCode());
                throw new RuntimeException("KIS Access Token 발급 실패");
            }
        } catch (Exception e) {
            log.error("KIS Access Token 발급 중 예외 발생: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }

    /**
     * KIS API를 이용해 국내 주식 현재가 정보 조회
     */
    public Map<String, Object> getStockPrice(String code) {
        try {
            String token = getAccessToken();
            if (token == null) {
                return null;
            }

            String url = kisConfig.getBaseUrl() + "/uapi/domestic-stock/v1/quotations/inquire-price";
            
            // Query parameters
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("FID_COND_MRKT_DIV_CODE", "J")
                    .queryParam("FID_INPUT_ISCD", code);

            HttpHeaders headers = new HttpHeaders();
            headers.set("content-type", "application/json; charset=utf-8");
            headers.set("authorization", "Bearer " + token);
            headers.set("appkey", kisConfig.getAppKey());
            headers.set("appsecret", kisConfig.getAppSecret());
            headers.set("tr_id", "FHPST01010000"); // 국내주식 현재가 조회 ID

            HttpEntity<?> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    builder.toUriString(),
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode output = root.path("output");
                if (!output.isMissingNode() && !output.isNull()) {
                    Map<String, Object> result = new HashMap<>();
                    result.put("price", output.path("stck_prpr").asInt());
                    result.put("changePrice", output.path("prdy_vrss").asInt());
                    result.put("changeRate", output.path("prdy_ctrt").asDouble());
                    
                    String sign = output.path("prdy_vrss_sign").asText();
                    // sign: 1(상한), 2(상승), 3(보합), 4(하한), 5(하락)
                    result.put("isRising", "1".equals(sign) || "2".equals(sign));
                    return result;
                }
            }
            log.warn("KIS 현재가 API 응답 형식 에러 또는 실패: code={}", code);
        } catch (Exception e) {
            log.error("KIS 현재가 조회 중 에러 발생 (code={}): {}", code, e.getMessage());
        }
        return null; // 실패 시 null 반환하여 상위 서비스에서 fallback 처리하도록 함
    }

    /**
     * 한국투자증권 거래량 순위 API를 이용하여 상위 10개 종목 정보 조회 (지연 및 TPS 방지용)
     */
    public java.util.List<java.util.Map<String, Object>> getVolumeRanking() {
        try {
            String token = getAccessToken();
            if (token == null) {
                return java.util.Collections.emptyList();
            }

            String url = kisConfig.getBaseUrl() + "/uapi/domestic-stock/v1/quotations/volume-rank";
            
            // Query parameters (11개 필수 값 포함)
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("FID_COND_MRKT_DIV_CODE", "J")
                    .queryParam("FID_COND_SCR_DIV_CODE", "20171")
                    .queryParam("FID_INPUT_ISCD", "0000") // 전체 시장
                    .queryParam("FID_DIV_CLS_CODE", "0")   // 전체 종목
                    .queryParam("FID_BLNG_CLS_CODE", "0")  // 평균 거래량 기준
                    .queryParam("FID_TRGT_CLS_CODE", "111111111")
                    .queryParam("FID_TRGT_EXLS_CLS_CODE", "0000000000")
                    .queryParam("FID_INPUT_PRICE_1", "")
                    .queryParam("FID_INPUT_PRICE_2", "")
                    .queryParam("FID_VOL_CNT", "")
                    .queryParam("FID_INPUT_DATE_1", "");

            HttpHeaders headers = new HttpHeaders();
            headers.set("content-type", "application/json; charset=utf-8");
            headers.set("authorization", "Bearer " + token);
            headers.set("appkey", kisConfig.getAppKey());
            headers.set("appsecret", kisConfig.getAppSecret());
            headers.set("tr_id", "FHPST01710000"); // 거래량 순위 TR ID

            HttpEntity<?> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    builder.toUriString(),
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode output = root.path("output");
                if (output.isArray()) {
                    java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
                    int count = 0;
                    for (JsonNode item : output) {
                        if (count >= 10) break;
                        
                        Map<String, Object> map = new HashMap<>();
                        // mksc_shrn_iscd: 유가증권 단축 종목코드
                        map.put("code", item.path("mksc_shrn_iscd").asText());
                        // hts_kor_isnm: HTS 한글 종목명
                        map.put("name", item.path("hts_kor_isnm").asText());
                        map.put("price", item.path("stck_prpr").asInt());
                        map.put("changePrice", item.path("prdy_vrss").asInt());
                        map.put("changeRate", item.path("prdy_ctrt").asDouble());
                        
                        String sign = item.path("prdy_vrss_sign").asText();
                        // sign: 1(상한), 2(상승), 3(보합), 4(하한), 5(하락)
                        map.put("isRising", "1".equals(sign) || "2".equals(sign));
                        
                        list.add(map);
                        count++;
                    }
                    return list;
                }
            }
            log.warn("KIS 거래량 순위 API 응답 형식 에러 또는 실패");
        } catch (Exception e) {
            log.error("KIS 거래량 순위 조회 중 에러 발생: {}", e.getMessage());
        }
        return java.util.Collections.emptyList();
    }

    /**
     * KIS API를 이용해 국내 주식 현재가 정보 및 재무 비율(PER, PBR, EPS, BPS) 조회
     */
    public Map<String, Object> getStockDetailWithFundamentals(String code) {
        try {
            String token = getAccessToken();
            if (token == null) {
                return null;
            }

            String url = kisConfig.getBaseUrl() + "/uapi/domestic-stock/v1/quotations/inquire-price";
            
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("FID_COND_MRKT_DIV_CODE", "J")
                    .queryParam("FID_INPUT_ISCD", code);

            HttpHeaders headers = new HttpHeaders();
            headers.set("content-type", "application/json; charset=utf-8");
            headers.set("authorization", "Bearer " + token);
            headers.set("appkey", kisConfig.getAppKey());
            headers.set("appsecret", kisConfig.getAppSecret());
            headers.set("tr_id", "FHKST01010100"); // 주식현재가 기본조사 TR ID (FHKST01010100)

            HttpEntity<?> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    builder.toUriString(),
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode output = root.path("output");
                if (!output.isMissingNode() && !output.isNull()) {
                    Map<String, Object> result = new HashMap<>();
                    result.put("price", output.path("stck_prpr").asInt());
                    result.put("changePrice", output.path("prdy_vrss").asInt());
                    result.put("changeRate", output.path("prdy_ctrt").asDouble());
                    
                    String sign = output.path("prdy_vrss_sign").asText();
                    result.put("isRising", "1".equals(sign) || "2".equals(sign));
                    
                    // PER, PBR, EPS, BPS 파싱
                    result.put("per", output.path("per").asDouble(0.0));
                    result.put("pbr", output.path("pbr").asDouble(0.0));
                    result.put("eps", output.path("eps").asDouble(0.0));
                    result.put("bps", output.path("bps").asDouble(0.0));
                    return result;
                }
            }
            log.warn("KIS 현재가 상세 API 응답 형식 에러 또는 실패: code={}", code);
        } catch (Exception e) {
            log.error("KIS 현재가 상세 조회 중 에러 발생 (code={}): {}", code, e.getMessage());
        }
        return null;
    }
}

