package com.vibe.kosmo.member;

import com.vibe.kosmo.global.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final ProfileImageService profileImageService;

    // 회원가입
    @Transactional
    public void signup(SignupRequest request, MultipartFile profileImage) {
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        Member member = Member.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .role(Role.ROLE_USER) // 기본 권한: USER
                .build();

        // 1. 회원 정보 먼저 저장 (Id가 생성되어야 1:1 관계의 프로필 저장 가능)
        Member savedMember = memberRepository.save(member);

        // 2. 프로필 이미지가 존재하면 업로드 및 저장 연계
        if (profileImage != null && !profileImage.isEmpty()) {
            MemberProfile memberProfile = profileImageService.saveProfileImage(profileImage, savedMember);
            savedMember.updateProfile(memberProfile);
        }
    }

    // 로그인
    public AuthResponse login(LoginRequest request) {
        Member member = memberRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        if (!passwordEncoder.matches(request.getPassword(), member.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // JWT 토큰 생성
        String token = jwtTokenProvider.createToken(member.getEmail(), member.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .email(member.getEmail())
                .nickname(member.getNickname())
                .role(member.getRole().name())
                .build();
    }

    // 내 정보 조회
    public MemberInfoResponse getMemberInfo(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        return MemberInfoResponse.builder()
                .email(member.getEmail())
                .nickname(member.getNickname())
                .role(member.getRole().name())
                .build();
    }
}
