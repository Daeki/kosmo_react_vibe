import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../utils/api';

export default function NoticeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notice, setNotice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNoticeDetail = async () => {
    setIsLoading(true);
    setError('');
    try {
      // fetchAPI는 자동으로 '/api'를 접두사로 추가해 요청합니다.
      const data = await fetchAPI(`/notices/${id}`);
      setNotice(data);
    } catch (err) {
      setError(err.message || '공지사항을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNoticeDetail();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('이 공지사항을 정말 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) {
      return;
    }
    try {
      await fetchAPI(`/notices/${id}`, {
        method: 'DELETE'
      });
      alert('공지사항이 정상적으로 삭제되었습니다.');
      navigate('/notice');
    } catch (err) {
      alert(err.message || '공지사항 삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (attachment) => {
    window.location.href = `/api/files/download/notice/${attachment.id}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-24 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="text-slate-500 text-xs font-semibold">공지사항을 불러오고 있습니다...</p>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6">
        <div className="p-5 bg-red-50 border border-red-100 rounded-3xl text-sm text-red-600 flex items-center justify-between">
          <span>⚠️ {error || '존재하지 않거나 삭제된 공지사항입니다.'}</span>
          <button 
            onClick={() => navigate('/notice')}
            className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* 뒤로가기 네비게이션 */}
      <div className="flex items-center">
        <button 
          onClick={() => navigate('/notice')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          공지사항 목록
        </button>
      </div>

      {/* 공지 상세 카드 */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6 md:p-8 space-y-6">
        
        {/* 상단 메타 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {notice.isPinned && (
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-extrabold tracking-tight">
                중요 공지
              </span>
            )}
          </div>
          
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">
            {notice.title}
          </h1>

          <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-1">
            <div className="flex items-center gap-3">
              <span className="text-slate-600 font-semibold">{notice.authorNickname}</span>
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <span>{formatDate(notice.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>조회</span>
              <span className="text-slate-600 font-bold">{notice.views}</span>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* 본문 */}
        <div className="text-slate-800 leading-relaxed text-sm md:text-[15px] whitespace-pre-wrap break-words py-2 font-medium">
          {notice.content}
        </div>

        {/* 첨부파일 섹션 */}
        {notice.attachments && notice.attachments.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-extrabold text-slate-500 tracking-wider uppercase">첨부파일 ({notice.attachments.length})</h4>
            <div className="grid gap-2.5">
              {notice.attachments.map((file) => (
                <div 
                  key={file.id}
                  onClick={() => handleDownload(file)}
                  className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* 클립/파일 아이콘 */}
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:border-blue-100 transition-all flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors truncate">
                        {file.originalFileName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {formatFileSize(file.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-lg hover:bg-slate-200/50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 하단 이동 및 동작 컨트롤 */}
      <div className="flex justify-center gap-3 pt-2">
        <button 
          onClick={() => navigate('/notice')}
          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-sm font-bold transition-all shadow-sm active:scale-[0.98]"
        >
          목록으로 돌아가기
        </button>
        {user?.role === 'ROLE_ADMIN' && user?.email === notice?.authorEmail && (
          <>
            <button 
              onClick={() => navigate(`/notice/edit/${id}`)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-blue-100 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98]"
            >
              수정하기
            </button>
            <button 
              onClick={handleDelete}
              className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-sm font-bold transition-all shadow-sm active:scale-[0.98]"
            >
              삭제하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
