package com.vibe.kosmo.global.config;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/api/hello")
    public String hello() {
        return "Toss Stock 백엔드가 정상적으로 작동 중입니다! (Java 21 + Spring Boot 3)";
    }
}
