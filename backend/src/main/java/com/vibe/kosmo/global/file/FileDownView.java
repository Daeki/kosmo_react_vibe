package com.vibe.kosmo.global.file;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.servlet.view.AbstractView;

import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component("fileDownView")
public class FileDownView extends AbstractView {

    public FileDownView() {
        setContentType("application/octet-stream; charset=utf-8");
    }

    @Override
    protected void renderMergedOutputModel(Map<String, Object> model, HttpServletRequest request, HttpServletResponse response) throws Exception {
        File file = (File) model.get("downloadFile");
        String originalFileName = (String) model.get("originalFileName");

        response.setContentType(getContentType());
        response.setContentLength((int) file.length());

        String userAgent = request.getHeader("User-Agent");
        String encodedFileName;

        if (userAgent != null && (userAgent.contains("MSIE") || userAgent.contains("Trident"))) {
            encodedFileName = URLEncoder.encode(originalFileName, StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        } else {
            encodedFileName = new String(originalFileName.getBytes(StandardCharsets.UTF_8), StandardCharsets.ISO_8859_1);
        }

        response.setHeader("Content-Disposition", "attachment; filename=\"" + encodedFileName + "\";");
        response.setHeader("Content-Transfer-Encoding", "binary");

        try (FileInputStream fis = new FileInputStream(file); OutputStream out = response.getOutputStream()) {
            FileCopyUtils.copy(fis, out);
        }
    }
}
