import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password, nickname);
      setSuccess('회원가입이 성공적으로 완료되었습니다! 잠시 후 로그인 페이지로 이동합니다.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">회원가입</h1>
          <p className="text-sm text-slate-500 mt-1">간편하게 가입하고 토스증권 Vibe를 즐겨보세요.</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 flex items-center gap-2">
            <span className="font-semibold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* 성공 메시지 */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-600 flex items-center gap-2">
            <span className="font-semibold">🎉</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이메일 입력 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">이메일 주소</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-sm"
            />
          </div>

          {/* 닉네임 입력 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="토스투자왕"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-sm"
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
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-sm"
            />
          </div>

          {/* 비밀번호 확인 입력 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-sm"
            />
          </div>

          {/* 가입 버튼 */}
          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-2xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-100 active:scale-[0.98]"
          >
            {isLoading ? '가입 신청 중...' : '회원가입 완료'}
          </button>
        </form>

        {/* 이동 링크 */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <span className="text-sm text-slate-500">이미 계정이 있으신가요? </span>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-150 ml-1"
          >
            로그인하기
          </button>
        </div>

      </div>
    </div>
  );
}
