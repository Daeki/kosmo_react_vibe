package com.vibe.kosmo.member;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // 회원가입 API
    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> signup(@Valid @RequestBody SignupRequest request) {
        authService.signup(request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "회원가입이 성공적으로 완료되었습니다.");
        return ResponseEntity.ok(response);
    }

    // 로그인 API
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    // 내 정보 조회 API (로그인 확인용)
    @GetMapping("/me")
    public ResponseEntity<MemberInfoResponse> getMyInfo(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        MemberInfoResponse response = authService.getMemberInfo(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
