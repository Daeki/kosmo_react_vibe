package com.vibe.kosmo.global.file;

import com.vibe.kosmo.notice.NoticeAttachment;
import com.vibe.kosmo.notice.NoticeAttachmentRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileDownloadController {

    private final NoticeAttachmentRepository noticeAttachmentRepository;
    private final FileDownView fileDownView;
    
    // 파일 업로드 디렉토리 경로 (NoticeService와 동일한 uploads/ 폴더)
    private final String uploadDir = System.getProperty("user.dir") + "/uploads/";

    @GetMapping("/download/{domainType}/{id}")
    public void downloadFile(
            @PathVariable String domainType,
            @PathVariable Long id,
            HttpServletRequest request,
            HttpServletResponse response) throws Exception {
        
        File file;
        String originalFileName;

        if ("notice".equalsIgnoreCase(domainType)) {
            NoticeAttachment attachment = noticeAttachmentRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 첨부파일입니다. ID: " + id));
            
            file = new File(uploadDir + attachment.getStoreFileName());
            originalFileName = attachment.getOriginalFileName();
        } else {
            // 향후 자유게시판(board), 프로필(profile) 등 추가 도메인 발생 시 분기 추가로 유연한 확장 가능
            throw new IllegalArgumentException("지원하지 않는 다운로드 도메인 유형입니다: " + domainType);
        }

        if (!file.exists()) {
            throw new IllegalArgumentException("서버에 실제 파일이 존재하지 않습니다.");
        }

        Map<String, Object> model = new HashMap<>();
        model.put("downloadFile", file);
        model.put("originalFileName", originalFileName);

        fileDownView.render(model, request, response);
    }
}
