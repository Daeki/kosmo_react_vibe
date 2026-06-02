package com.vibe.kosmo.notice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {

    /**
     * 상단 고정글(isPinned) 여부를 기준으로 내림차순(true가 위로), 
     * 그 다음 생성 일시(createdAt) 기준 내림차순으로 페이징 조회합니다.
     */
    Page<Notice> findAllByOrderByIsPinnedDescCreatedAtDesc(Pageable pageable);

    /**
     * 공지사항 상세 조회 시 조회수를 안전하게 1 증가시킵니다.
     */
    @Modifying
    @Query("update Notice n set n.views = n.views + 1 where n.id = :id")
    int updateViews(@Param("id") Long id);
}
