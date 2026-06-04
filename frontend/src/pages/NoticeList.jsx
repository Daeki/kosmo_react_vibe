import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../utils/api';

export default function NoticeList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotices = async (currentPage) => {
    setIsLoading(true);
    setError('');
    try {
      // fetchAPI는 자동으로 '/api'를 접두사로 추가해 요청합니다.
      const data = await fetchAPI(`/notices?page=${currentPage}&size=10`);
      setNotices(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.message || '공지사항 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotices(page);
  }, [page]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 고정공지와 일반공지 분리
  const pinnedNotices = notices.filter(n => n.isPinned);
  const regularNotices = notices.filter(n => !n.isPinned);

  if (isLoading && notices.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="text-slate-500 text-xs font-semibold">공지사항을 가져오고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 상단 타이틀 */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">공지사항</h1>
          <p className="text-xs text-slate-400 mt-1">토스증권 Vibe의 새로운 소식을 확인해보세요.</p>
        </div>
        {user?.role === 'ROLE_ADMIN' && (
          <button
            onClick={() => navigate('/notice/create')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100 hover:shadow-lg active:scale-[0.98]"
          >
            공지 작성
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600">
          ⚠️ {error}
        </div>
      )}

      {notices.length === 0 ? (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl text-amber-800 flex items-start space-x-3 shadow-sm">
          <span className="text-2xl mt-0.5">⚠️</span>
          <div>
            <p className="font-extrabold text-sm">경고: 등록된 공지사항 데이터가 존재하지 않습니다.</p>
            <p className="text-xs text-amber-600/90 mt-0.5">새로운 소식이 준비되는 대로 공지사항이 등록될 예정입니다. 잠시만 기다려 주세요.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden divide-y divide-slate-100/60">
          
          {/* 📌 중요 고정 공지사항 렌더링 */}
          {pinnedNotices.map((notice) => (
            <div 
              key={notice.id} 
              onClick={() => navigate(`/notice/${notice.id}`)}
              className="p-5 bg-blue-50/30 hover:bg-blue-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-extrabold tracking-tight">
                    중요
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {notice.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                  <span>{notice.authorNickname}</span>
                  <span className="w-1 h-1 bg-slate-200 rounded-full" />
                  <span>{formatDate(notice.createdAt)}</span>
                </div>
              </div>
              <div className="text-xs font-semibold text-slate-400">
                조회 {notice.views}
              </div>
            </div>
          ))}

          {/* 📄 일반 공지사항 렌더링 */}
          {regularNotices.map((notice) => (
            <div 
              key={notice.id} 
              onClick={() => navigate(`/notice/${notice.id}`)}
              className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {notice.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                  <span>{notice.authorNickname}</span>
                  <span className="w-1 h-1 bg-slate-200 rounded-full" />
                  <span>{formatDate(notice.createdAt)}</span>
                </div>
              </div>
              <div className="text-xs font-semibold text-slate-400">
                조회 {notice.views}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 버튼 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 bg-white border border-slate-100 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            이전
          </button>
          
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setPage(idx)}
              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                page === idx
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                  : 'bg-white border border-slate-100 hover:bg-slate-50 text-slate-600 shadow-sm'
              }`}
            >
              {idx + 1}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-2 bg-white border border-slate-100 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
