package com.vibe.kosmo.global.config;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UploadFileResult {
    private final String originalFileName;
    private final String storeFileName;
    private final String filePath;
    private final Long fileSize;
    private final String contentType;
}
