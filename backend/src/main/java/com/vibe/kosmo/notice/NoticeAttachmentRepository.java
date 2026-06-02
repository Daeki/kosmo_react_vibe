package com.vibe.kosmo.notice;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NoticeAttachmentRepository extends JpaRepository<NoticeAttachment, Long> {
}
