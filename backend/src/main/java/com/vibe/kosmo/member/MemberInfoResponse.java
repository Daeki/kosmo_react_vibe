package com.vibe.kosmo.member;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class MemberInfoResponse {
    private String email;
    private String nickname;
    private String role;
}
