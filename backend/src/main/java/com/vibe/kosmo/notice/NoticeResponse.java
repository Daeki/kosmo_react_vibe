package com.vibe.kosmo.notice;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
@Builder
public class NoticeResponse {
    private Long id;
    private String title;
    private int views;
    private boolean isPinned;
    private String authorNickname;
    private LocalDateTime createdAt;
}
