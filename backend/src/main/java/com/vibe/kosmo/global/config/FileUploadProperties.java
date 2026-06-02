package com.vibe.kosmo.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@ConfigurationProperties(prefix = "file")
@Getter
@Setter
public class FileUploadProperties {
    private String uploadDir;
    private Map<String, String> paths = new HashMap<>();
}
