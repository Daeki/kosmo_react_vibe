const API_BASE = '/api';

/**
 * 공통 API 요청 유틸리티
 * @param {string} endpoint - API 엔드포인트 (예: '/auth/login')
 * @param {object} options - Fetch 옵션 (method, body, headers 등)
 */
export async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  // 기본 헤더 설정
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 로컬 스토리지에서 JWT 토큰 가져오기
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    // 401 Unauthorized 일 때 토큰 초기화
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 브라우저 환경에서 페이지 리로드를 하거나 리다이렉션을 발생시킬 수 있음
      window.dispatchEvent(new Event('auth-unauthorized'));
    }

    // JSON 응답 처리
    const contentType = response.headers.get('content-type');
    let data = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // 백엔드 예외 응답(error 필드) 우선 처리
      const errorMessage = data && typeof data === 'object' && data.error 
        ? data.error 
        : `요청 실패 (상태 코드: ${response.status})`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
}
