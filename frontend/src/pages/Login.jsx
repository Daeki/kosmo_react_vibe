import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // 로그인 성공 시 메인화면으로 이동
      navigate('/');
    } catch (err) {
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-slate-100 transition-all duration-300">
        
        {/* 로고 및 설명 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 text-2xl font-bold mb-3">
            V
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">토스증권 Vibe 로그인</h1>
          <p className="text-sm text-slate-500 mt-1">간편하게 로그인하고 주식 투자 커뮤니티에 참여하세요.</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 flex items-center gap-2">
            <span className="font-semibold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이메일 입력 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">이메일 주소</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-sm"
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-sm"
            />
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-2xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-100 active:scale-[0.98]"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 이동 링크 */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <span className="text-sm text-slate-500">아직 회원이 아니신가요? </span>
          <button
            onClick={() => navigate('/signup')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-150 ml-1"
          >
            회원가입하기
          </button>
        </div>

      </div>
    </div>
  );
}
