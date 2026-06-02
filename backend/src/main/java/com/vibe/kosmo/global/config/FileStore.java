package com.vibe.kosmo.global.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class FileStore {

    private final FileUploadProperties properties;

    /**
     * 특정 도메인 키(members, boards 등)에 맞추어 yml에서 주입된 경로를 기반으로 파일을 업로드합니다.
     */
    public UploadFileResult storeFile(MultipartFile file, String domainKey) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        // yml 설정에서 하위 경로 조회
        String subFolder = properties.getPaths().get(domainKey);
        if (subFolder == null) {
            log.error("정의되지 않은 업로드 경로 키: {}", domainKey);
            throw new IllegalArgumentException("정의되지 않은 업로드 경로 키입니다: " + domainKey);
        }

        // 베이스 경로와 결합한 물리 디렉토리 경로 획득
        String targetDirPath = getFullPath(subFolder);

        // 디렉토리 자동 생성
        File directory = new File(targetDirPath);
        if (!directory.exists()) {
            boolean created = directory.mkdirs();
            if (created) {
                log.info("새로운 파일 업로드 디렉토리 생성 완료: {}", targetDirPath);
            }
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "unknown";
        }

        String ext = extractExt(originalFilename);
        String storeFilename = UUID.randomUUID().toString() + (ext.isEmpty() ? "" : "." + ext);
        String fullPath = targetDirPath + storeFilename;

        try {
            // 디스크에 저장
            file.transferTo(new File(fullPath));
            log.info("파일 업로드 성공 [도메인: {}]. 원본: {}, 저장: {}", domainKey, originalFilename, storeFilename);
        } catch (IOException e) {
            log.error("파일 저장 중 입출력 오류 발생. 경로: {}, 에러: {}", fullPath, e.getMessage(), e);
            throw new RuntimeException("파일 저장 실패", e);
        }

        return new UploadFileResult(
                originalFilename,
                storeFilename,
                targetDirPath,
                file.getSize(),
                file.getContentType()
        );
    }

    private String getFullPath(String subFolder) {
        String base = properties.getUploadDir();
        base = base.endsWith("/") ? base : base + "/";
        subFolder = subFolder.endsWith("/") ? subFolder : subFolder + "/";
        return base + subFolder;
    }

    /**
     * 특정 도메인과 파일명을 받아 실제 저장된 풀 경로를 동적으로 리턴합니다.
     * 예: "members", "photo.png" -> "D:/upload/members/photo.png"
     */
    public String getFullFilePath(String domainKey, String storeFileName) {
        String subFolder = properties.getPaths().get(domainKey);
        if (subFolder == null) {
            log.error("정의되지 않은 업로드 경로 키: {}", domainKey);
            throw new IllegalArgumentException("정의되지 않은 업로드 경로 키입니다: " + domainKey);
        }
        return getFullPath(subFolder) + storeFileName;
    }

    private String extractExt(String originalFilename) {
        int pos = originalFilename.lastIndexOf(".");
        return pos == -1 ? "" : originalFilename.substring(pos + 1);
    }
}

