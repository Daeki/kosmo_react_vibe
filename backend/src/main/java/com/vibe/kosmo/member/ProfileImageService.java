package com.vibe.kosmo.member;

import com.vibe.kosmo.global.config.FileStore;
import com.vibe.kosmo.global.config.UploadFileResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileImageService {

    private final FileStore fileStore;

    /**
     * 업로드된 프로필 이미지를 물리 저장소에 저장하고 MemberProfile 엔티티를 생성합니다.
     */
    public MemberProfile saveProfileImage(MultipartFile file, Member member) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        // 공통 FileStore를 호출하여 "members" 하위 폴더에 파일 저장 수행
        UploadFileResult result = fileStore.storeFile(file, "members");
        if (result == null) {
            return null;
        }

        return MemberProfile.builder()
                .member(member)
                .originalFileName(result.getOriginalFileName())
                .storeFileName(result.getStoreFileName())
                .fileSize(result.getFileSize())
                .contentType(result.getContentType())
                .build();
    }
}

