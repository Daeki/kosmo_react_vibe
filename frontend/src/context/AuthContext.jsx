import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 현재 로그인 정보 확인
  const checkMe = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchAPI('/auth/me');
      setUser(data);
    } catch (error) {
      console.error('자동 로그인 확인 실패:', error.message);
      // 토큰 만료 또는 에러 시 정리
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMe();

    // 401 Unauthorized 전역 이벤트 리스너 등록
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  // 로그인
  const login = async (email, password) => {
    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      // 로컬스토리지에 토큰 및 사용자 정보 저장
      localStorage.setItem('token', data.token);
      setUser({
        email: data.email,
        nickname: data.nickname,
        role: data.role,
      });
      return data;
    } catch (error) {
      throw error;
    }
  };

  // 회원가입
  const signup = async (email, password, nickname) => {
    try {
      await fetchAPI('/auth/signup', {
        method: 'POST',
        body: { email, password, nickname },
      });
    } catch (error) {
      throw error;
    }
  };

  // 로그아웃
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    checkMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내에서 사용되어야 합니다.');
  }
  return context;
}
