package com.vibe.kosmo.notice;

import com.vibe.kosmo.member.Member;
import com.vibe.kosmo.member.MemberRepository;
import com.vibe.kosmo.member.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class NoticeDataInitializer implements CommandLineRunner {

    private final NoticeRepository noticeRepository;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (noticeRepository.count() > 0) {
            return; // 이미 데이터가 존재하는 경우 중복 적재 방지
        }

        // 1. 관리자(어드민) 계정 조회 또는 생성
        Member admin = memberRepository.findByEmail("admin@example.com")
                .orElseGet(() -> {
                    Member newAdmin = Member.builder()
                            .email("admin@example.com")
                            .password(passwordEncoder.encode("admin123"))
                            .nickname("어드민")
                            .role(Role.ROLE_ADMIN)
                            .build();
                    return memberRepository.save(newAdmin);
                });

        // 2. 중요 고정 공지사항 데이터 빌드 (isPinned = true)
        Notice p1 = Notice.builder()
                .title("[필독] 토스 스탁 Vibe 서비스 그랜드 오픈 안내")
                .content("안녕하세요. 토스 스탁 Vibe가 정식 오픈했습니다! 앞으로 유용한 주식 정보와 따뜻한 커뮤니티 공간을 제공하겠습니다.")
                .isPinned(true)
                .views(320)
                .author(admin)
                .build();

        Notice p2 = Notice.builder()
                .title("[공지] 개인정보 처리방침 개정 및 서비스 이용약관 변경 안내")
                .content("개인정보 처리방침이 일부 개정되었습니다. 주요 개정 사항을 확인하시어 서비스 이용에 참고하시기 바랍니다.")
                .isPinned(true)
                .views(95)
                .author(admin)
                .build();

        // 3. 일반 공지사항 데이터 빌드 (isPinned = false)
        Notice r1 = Notice.builder()
                .title("커뮤니티 내 비매너 행위 신고 및 제재 기준 안내")
                .content("클린한 게시판 문화를 위해 비매너 사용자 제재 규정을 공지합니다. 타인 비방이나 광고성 게시글은 예고 없이 삭제될 수 있습니다.")
                .isPinned(false)
                .views(54)
                .author(admin)
                .build();

        Notice r2 = Notice.builder()
                .title("토스증권 Vibe 모바일 웹 호환성 개선 업데이트 완료")
                .content("모바일 브라우저에서의 렌더링 성능과 화면 깨짐 현상을 대폭 개선했습니다. 최신 크롬 및 사파리 환경을 권장합니다.")
                .isPinned(false)
                .views(12)
                .author(admin)
                .build();

        Notice r3 = Notice.builder()
                .title("계정 비밀번호 변경 및 보안 강화 권고 사항")
                .content("소중한 개인정보 보호를 위해 타 사이트와 중복되지 않는 안전한 비밀번호로 주기적 변경을 권장해 드립니다.")
                .isPinned(false)
                .views(8)
                .author(admin)
                .build();

        Notice r4 = Notice.builder()
                .title("시스템 데이터베이스 서버 정기 점검 일정 안내 (6/15)")
                .content("오는 6월 15일 새벽 2시부터 4시까지 정기 시스템 점검이 있을 예정입니다. 해당 시간에는 서비스 조회가 일시 중단될 수 있습니다.")
                .isPinned(false)
                .views(3)
                .author(admin)
                .build();

        noticeRepository.saveAll(Arrays.asList(p1, p2, r1, r2, r3, r4));
        System.out.println("공지사항 더미 데이터 시딩(Seeding) 성공.");
    }
}
