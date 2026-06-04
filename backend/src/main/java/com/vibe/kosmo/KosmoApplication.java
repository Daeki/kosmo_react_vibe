package com.vibe.kosmo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class KosmoApplication {
    public static void main(String[] args) {
        SpringApplication.run(KosmoApplication.class, args);
    }
}



