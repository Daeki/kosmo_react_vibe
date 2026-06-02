package com.vibe.kosmo.notice;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    /**
     * 공지사항 목록을 페이징 조회합니다. (비인증 상태 접근 허용)
     */
    @GetMapping
    public ResponseEntity<Page<NoticeResponse>> getNotices(@PageableDefault(size = 10) Pageable pageable) {
        Page<NoticeResponse> response = noticeService.getNoticeList(pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * 공지사항 상세 내용을 조회합니다. (비인증 상태 접근 허용, 조회수 증가 포함)
     */
    @GetMapping("/{id}")
    public ResponseEntity<NoticeDetailResponse> getNoticeDetail(@PathVariable Long id) {
        NoticeDetailResponse response = noticeService.getNoticeDetail(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 새로운 공지사항을 생성합니다. (ADMIN 관리자 권한 필수)
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<NoticeResponse> createNotice(
            @ModelAttribute NoticeCreateRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails) {
        NoticeResponse response = noticeService.createNotice(request, files, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * 기존 공지사항을 수정합니다. (ADMIN 관리자 권한 필수)
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<NoticeResponse> updateNotice(
            @PathVariable Long id,
            @ModelAttribute NoticeUpdateRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails userDetails) {
        NoticeResponse response = noticeService.updateNotice(id, request, files, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * 공지사항을 삭제합니다. (ADMIN 관리자 권한 필수, 작성자 본인만 가능)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<java.util.Map<String, String>> deleteNotice(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        noticeService.deleteNotice(id, userDetails.getUsername());
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("message", "공지사항이 성공적으로 삭제되었습니다.");
        return ResponseEntity.ok(response);
    }
}
