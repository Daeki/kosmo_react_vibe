package com.vibe.kosmo.notice;

import com.vibe.kosmo.member.Member;
import com.vibe.kosmo.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final MemberRepository memberRepository;

    // 파일 업로드 디렉토리 경로 (프로젝트 루트 하위 uploads/)
    private final String uploadDir = System.getProperty("user.dir") + "/uploads/";

    /**
     * 상단 고정글 우선 및 최신순 공지사항 리스트를 페이징 조회합니다.
     */
    public Page<NoticeResponse> getNoticeList(Pageable pageable) {
        Page<Notice> notices = noticeRepository.findAllByOrderByIsPinnedDescCreatedAtDesc(pageable);
        return notices.map(this::convertToResponse);
    }

    /**
     * 공지사항 상세 조회 정보를 조회하고 조회수를 1 증가시킵니다.
     */
    @Transactional
    public NoticeDetailResponse getNoticeDetail(Long id) {
        // 1. 조회수 증가
        int updated = noticeRepository.updateViews(id);
        if (updated == 0) {
            throw new IllegalArgumentException("해당 공지사항이 존재하지 않습니다. ID: " + id);
        }

        // 2. 공지사항 조회
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 존재하지 않습니다. ID: " + id));

        // 3. DTO 변환
        String nickname = (notice.getAuthor() != null) ? notice.getAuthor().getNickname() : "탈퇴한 관리자";
        String authorEmail = (notice.getAuthor() != null) ? notice.getAuthor().getEmail() : null;

        List<NoticeDetailResponse.AttachmentDto> attachmentDtos = notice.getAttachments().stream()
                .map(att -> NoticeDetailResponse.AttachmentDto.builder()
                        .id(att.getId())
                        .originalFileName(att.getOriginalFileName())
                        .storeFileName(att.getStoreFileName())
                        .fileSize(att.getFileSize())
                        .contentType(att.getContentType())
                        .build())
                .toList();

        return NoticeDetailResponse.builder()
                .id(notice.getId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .views(notice.getViews())
                .isPinned(notice.isPinned())
                .authorNickname(nickname)
                .authorEmail(authorEmail)
                .createdAt(notice.getCreatedAt())
                .attachments(attachmentDtos)
                .build();
    }

    /**
     * 새로운 공지사항을 생성합니다. (첨부파일 최대 5개 검증 포함)
     */
    @Transactional
    public NoticeResponse createNotice(NoticeCreateRequest request, List<MultipartFile> files, String email) {
        // 1. 작성자 회원 조회
        Member author = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다. Email: " + email));

        // 2. 파일 개수 검증 (최대 5개)
        if (files != null && files.size() > 5) {
            throw new IllegalArgumentException("첨부파일은 최대 5개까지만 업로드 가능합니다.");
        }

        // 3. Notice 엔티티 빌드 및 저장
        Notice notice = Notice.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .isPinned(request.isPinned())
                .author(author)
                .build();

        // 4. 파일 저장 및 연계
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                try {
                    NoticeAttachment attachment = saveFile(file, notice);
                    notice.addAttachment(attachment);
                } catch (IOException e) {
                    throw new RuntimeException("파일 업로드 중 오류가 발생했습니다: " + file.getOriginalFilename(), e);
                }
            }
        }

        Notice savedNotice = noticeRepository.save(notice);
        return convertToResponse(savedNotice);
    }

    private NoticeAttachment saveFile(MultipartFile file, Notice notice) throws IOException {
        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null) {
            originalFileName = "unnamed";
        }
        
        // 확장자 추출
        String ext = "";
        int dotIdx = originalFileName.lastIndexOf(".");
        if (dotIdx >= 0) {
            ext = originalFileName.substring(dotIdx);
        }
        
        // 고유 저장 파일명
        String storeFileName = UUID.randomUUID().toString() + ext;
        
        // 디렉토리 생성
        java.io.File dir = new java.io.File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        
        // 물리 파일 저장
        java.io.File targetFile = new java.io.File(uploadDir + storeFileName);
        file.transferTo(targetFile);
        
        return NoticeAttachment.builder()
                .notice(notice)
                .originalFileName(originalFileName)
                .storeFileName(storeFileName)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .build();
    }

    /**
     * 공지사항을 수정합니다. (기존 파일 개별 삭제 및 신규 추가 연계, 최대 5개 한계 검증)
     */
    @Transactional
    public NoticeResponse updateNotice(Long id, NoticeUpdateRequest request, List<MultipartFile> files, String email) {
        // 1. 공지사항 조회
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 존재하지 않습니다. ID: " + id));

        // 작성자 검증 (탈퇴한 관리자이거나 로그인 유저 이메일과 일치하지 않는 경우 수정 불가능)
        if (notice.getAuthor() == null || !notice.getAuthor().getEmail().equals(email)) {
            throw new org.springframework.security.access.AccessDeniedException("본인이 작성한 공지사항만 수정할 수 있습니다.");
        }

        // 2. 기존 파일 삭제 처리
        if (request.getDeleteAttachmentIds() != null && !request.getDeleteAttachmentIds().isEmpty()) {
            List<NoticeAttachment> toDelete = notice.getAttachments().stream()
                    .filter(att -> request.getDeleteAttachmentIds().contains(att.getId()))
                    .toList();

            for (NoticeAttachment attachment : toDelete) {
                // 물리 디스크 파일 삭제
                String fullPath = uploadDir + attachment.getStoreFileName();
                java.io.File fileOnDisk = new java.io.File(fullPath);
                if (fileOnDisk.exists()) {
                    fileOnDisk.delete();
                }
                // 양방향 연관관계 제거 (orphanRemoval로 인해 JPA가 DB 레코드도 자동 삭제)
                notice.getAttachments().remove(attachment);
                attachment.setNotice(null);
            }
        }

        // 3. 파일 개수 검증 (최종 유지 개수 = 기존 파일 남은 개수 + 신규 추가 개수)
        int newFilesCount = (files != null) ? (int) files.stream().filter(f -> !f.isEmpty()).count() : 0;
        int totalFilesCount = notice.getAttachments().size() + newFilesCount;
        if (totalFilesCount > 5) {
            throw new IllegalArgumentException("첨부파일은 최대 5개까지만 유지할 수 있습니다. (현재 총합: " + totalFilesCount + "개)");
        }

        // 4. 신규 파일 저장 및 연계
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                try {
                    NoticeAttachment attachment = saveFile(file, notice);
                    notice.addAttachment(attachment);
                } catch (IOException e) {
                    throw new RuntimeException("파일 업로드 중 오류가 발생했습니다: " + file.getOriginalFilename(), e);
                }
            }
        }

        // 5. 제목, 본문, 고정 여부 변경
        notice.setTitle(request.getTitle());
        notice.setContent(request.getContent());
        notice.setPinned(request.isPinned());

        return convertToResponse(notice);
    }

    private NoticeResponse convertToResponse(Notice notice) {
        String nickname = (notice.getAuthor() != null) ? notice.getAuthor().getNickname() : "탈퇴한 관리자";
        
        return NoticeResponse.builder()
                .id(notice.getId())
                .title(notice.getTitle())
                .views(notice.getViews())
                .isPinned(notice.isPinned())
                .authorNickname(nickname)
                .createdAt(notice.getCreatedAt())
                .build();
    }

    /**
     * 공지사항을 삭제합니다. (작성자 검증 및 물리 첨부파일 삭제 포함)
     */
    @Transactional
    public void deleteNotice(Long id, String email) {
        // 1. 공지사항 조회
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 존재하지 않습니다. ID: " + id));

        // 2. 작성자 검증 (탈퇴한 관리자이거나 로그인 유저 이메일과 일치하지 않는 경우 삭제 불가능)
        if (notice.getAuthor() == null || !notice.getAuthor().getEmail().equals(email)) {
            throw new org.springframework.security.access.AccessDeniedException("본인이 작성한 공지사항만 삭제할 수 있습니다.");
        }

        // 3. 연관된 물리 첨부파일 삭제
        if (notice.getAttachments() != null && !notice.getAttachments().isEmpty()) {
            for (NoticeAttachment attachment : notice.getAttachments()) {
                String fullPath = uploadDir + attachment.getStoreFileName();
                java.io.File fileOnDisk = new java.io.File(fullPath);
                if (fileOnDisk.exists()) {
                    fileOnDisk.delete();
                }
            }
        }

        // 4. DB 삭제 (JPA CascadeType.ALL에 의해 NoticeAttachment DB 레코드도 연쇄 삭제됨)
        noticeRepository.delete(notice);
    }
}
