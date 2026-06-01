# API 명세서 (API Specification) 초안

이 문서는 프로젝트에 도입될 REST API의 규격 초안입니다. 백엔드와 프론트엔드가 이 계약을 바탕으로 상호 통신합니다.

---

## 🔑 1. 회원 및 인증 API (Authentication)

### 1-1. 회원가입
* **Endpoint**: `POST /api/auth/signup`
* **인증 필요 여부**: 없음 (PermitAll)
* **요청 바디 (JSON)**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "nickname": "토스유저"
  }
  ```
* **응답 바디 (JSON)**:
  - **성공 (200 OK)**:
    ```json
    {
      "message": "회원가입이 성공적으로 완료되었습니다."
    }
    ```
  - **실패 (400 Bad Request - 중복 이메일 등)**:
    ```json
    {
      "error": "이미 사용 중인 이메일입니다."
    }
    ```

### 1-2. 로그인 (JWT 발급)
* **Endpoint**: `POST /api/auth/login`
* **인증 필요 여부**: 없음 (PermitAll)
* **요청 바디 (JSON)**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
* **응답 바디 (JSON)**:
  - **성공 (200 OK)**:
    ```json
    {
      "token": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQG...",
      "email": "user@example.com",
      "nickname": "토스유저",
      "role": "ROLE_USER"
    }
    ```
  - **실패 (400 Bad Request)**:
    ```json
    {
      "error": "비밀번호가 일치하지 않습니다."
    }
    ```

### 1-3. 내 정보 조회 (로그인 검증)
* **Endpoint**: `GET /api/auth/me`
* **인증 필요 여부**: **필수** (`Authorization` 헤더 필요)
* **요청 헤더**:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  ```
* **응답 바디 (JSON)**:
  - **성공 (200 OK)**:
    ```json
    {
      "email": "user@example.com",
      "nickname": "토스유저",
      "role": "ROLE_USER"
    }
    ```
  - **실패 (401 Unauthorized)**:
    - 비인증 요청 시 스프링 시큐리티 필터 단에서 401 코드가 반환됩니다.

---

## 💬 2. 자유게시판 API (Community Board)

### 2-1. 게시글 전체 목록 조회
* **Endpoint**: `GET /api/boards`
* **인증 필요 여부**: 없음 (최신 작성일 내림차순 정렬)
* **응답 바디 (JSON - 200 OK)**:
  ```json
  [
    {
      "id": 2,
      "title": "주식 초보인데 오늘 삼전 매수해도 될까요?",
      "content": "차트를 보니까 최근에 좀 하락했던데 어떻게 생각하시나요?",
      "writerNickname": "주린이1호",
      "writerEmail": "jurin@example.com",
      "createdAt": "2026-06-01T15:00:00",
      "updatedAt": null
    },
    {
      "id": 1,
      "title": "Toss Stock 커뮤니티 오픈 축하합니다!",
      "content": "토스 UI 느낌 나고 좋네요. 자주 오겠습니다.",
      "writerNickname": "토스유저",
      "writerEmail": "user@example.com",
      "createdAt": "2026-06-01T14:30:00",
      "updatedAt": "2026-06-01T14:40:00"
    }
  ]
  ```

### 2-2. 게시글 상세 조회
* **Endpoint**: `GET /api/boards/{id}`
* **인증 필요 여부**: 없음
* **응답 바디 (JSON - 200 OK)**:
  ```json
  {
    "id": 1,
    "title": "Toss Stock 커뮤니티 오픈 축하합니다!",
    "content": "토스 UI 느낌 나고 좋네요. 자주 오겠습니다.",
    "writerNickname": "토스유저",
    "writerEmail": "user@example.com",
    "createdAt": "2026-06-01T14:30:00",
    "updatedAt": "2026-06-01T14:40:00"
  }
  ```

### 2-3. 게시글 작성
* **Endpoint**: `POST /api/boards`
* **인증 필요 여부**: **필수**
* **요청 바디 (JSON)**:
  ```json
  {
    "title": "새로운 게시글 제목",
    "content": "새로운 게시글 내용입니다."
  }
  ```
* **응답 바디 (JSON - 200 OK)**:
  ```json
  {
    "id": 3,
    "title": "새로운 게시글 제목",
    "content": "새로운 게시글 내용입니다.",
    "writerNickname": "토스유저",
    "writerEmail": "user@example.com",
    "createdAt": "2026-06-01T17:30:00",
    "updatedAt": null
  }
  ```

### 2-4. 게시글 수정
* **Endpoint**: `PUT /api/boards/{id}`
* **인증 필요 여부**: **필수** (작성자 본인만 가능)
* **요청 바디 (JSON)**:
  ```json
  {
    "title": "수정된 게시글 제목",
    "content": "수정된 게시글 내용입니다."
  }
  ```
* **응답 바디 (JSON - 200 OK)**:
  ```json
  {
    "id": 3,
    "title": "수정된 게시글 제목",
    "content": "수정된 게시글 내용입니다.",
    "writerNickname": "토스유저",
    "writerEmail": "user@example.com",
    "createdAt": "2026-06-01T17:30:00",
    "updatedAt": "2026-06-01T17:40:00"
  }
  ```

### 2-5. 게시글 삭제
* **Endpoint**: `DELETE /api/boards/{id}`
* **인증 필요 여부**: **필수** (작성자 본인만 가능)
* **응답 바디 (JSON - 200 OK)**:
  ```json
  {
    "message": "게시글이 성공적으로 삭제되었습니다."
  }
  ```

---

## 📢 3. 공지사항 API (Notice)

### 3-1. 공지사항 목록 조회
* **Endpoint**: `GET /api/notices`
* **인증 필요 여부**: 없음
* **응답 바디**: 자유게시판 목록과 동일한 포맷

### 3-2. 공지사항 상세 조회
* **Endpoint**: `GET /api/notices/{id}`
* **인증 필요 여부**: 없음

### 3-3. 공지사항 등록 / 수정 / 삭제
* **Endpoints**:
  - 등록: `POST /api/notices`
  - 수정: `PUT /api/notices/{id}`
  - 삭제: `DELETE /api/notices/{id}`
* **인증 필요 여부**: **필수** (`ROLE_ADMIN` 관리자 권한 필수)
* **요청/응답 규격**: 자유게시판(Board)의 CRUD와 동일합니다.

---

## 📈 4. 주식 정보 API (Stock)

### 4-1. 인기 주식 목록 조회
* **Endpoint**: `GET /api/stocks`
* **인증 필요 여부**: 없음 (실시간 가격 변동 시뮬레이션 데이터 포함)
* **응답 바디 (JSON - 200 OK)**:
  ```json
  [
    {
      "code": "005930",
      "name": "삼성전자",
      "price": 74500,
      "changePrice": 300,
      "changeRate": 0.4,
      "isRising": true,
      "history": [73000, 73500, 72800, 74000, 73900, 74200, 74500]
    },
    {
      "code": "999999",
      "name": "비바리퍼블리카(토스)",
      "price": 52000,
      "changePrice": 1500,
      "changeRate": 2.97,
      "isRising": true,
      "history": [48000, 49500, 50000, 51000, 50500, 51500, 52000]
    }
  ]
  ```

### 4-2. 개별 주식 상세 조회
* **Endpoint**: `GET /api/stocks/{code}`
* **인증 필요 여부**: 없음
* **응답 바디 (JSON - 200 OK)**:
  ```json
  {
    "code": "005930",
    "name": "삼성전자",
    "price": 74500,
    "changePrice": 300,
    "changeRate": 0.4,
    "isRising": true,
    "history": [73000, 73500, 72800, 74000, 73900, 74200, 74500]
  }
  ```
