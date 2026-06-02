package com.vibe.kosmo.notice;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
@Builder
public class NoticeDetailResponse {
    private Long id;
    private String title;
    private String content;
    private int views;
    private boolean isPinned;
    private String authorNickname;
    private String authorEmail;
    private LocalDateTime createdAt;
    private List<AttachmentDto> attachments;

    @Getter
    @AllArgsConstructor
    @Builder
    public static class AttachmentDto {
        private Long id;
        private String originalFileName;
        private String storeFileName;
        private Long fileSize;
        private String contentType;
    }
}
