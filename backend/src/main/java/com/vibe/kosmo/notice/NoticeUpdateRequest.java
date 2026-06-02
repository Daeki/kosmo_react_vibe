package com.vibe.kosmo.notice;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoticeUpdateRequest {
    private String title;
    private String content;
    private boolean isPinned;
    private List<Long> deleteAttachmentIds;
}
