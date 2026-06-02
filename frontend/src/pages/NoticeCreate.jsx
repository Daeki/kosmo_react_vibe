import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../utils/api';

export default function NoticeCreate() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // 어드민 권한 체크 가드
  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'ROLE_ADMIN') {
        alert('공지사항 작성 권한이 없습니다.');
        navigate('/notice');
      }
    }
  }, [user, loading, navigate]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFilesToList(selectedFiles);
  };

  const addFilesToList = (newFiles) => {
    if (files.length + newFiles.length > 5) {
      alert('첨부파일은 최대 5개까지만 추가할 수 있습니다.');
      return;
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    addFilesToList(droppedFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('isPinned', isPinned);
      
      files.forEach((file) => {
        formData.append('files', file);
      });

      await fetchAPI('/notices', {
        method: 'POST',
        body: formData,
      });

      navigate('/notice');
    } catch (err) {
      setError(err.message || '공지사항 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || (!user || user.role !== 'ROLE_ADMIN')) {
    return (
      <div className="max-w-2xl mx-auto py-24 flex flex-col items-center justify-center">
        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status">
          <span className="sr-only">Checking privileges...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* 뒤로 가기 */}
      <div className="flex items-center">
        <button 
          onClick={() => navigate('/notice')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          뒤로가기
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">공지사항 작성</h1>
          <p className="text-xs text-slate-400 mt-1">새로운 서비스 공지 또는 중요 안내를 올립니다.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-semibold text-red-600">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 제목 입력 */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 tracking-wider uppercase">공지 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={150}
              className="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-100 focus:border-blue-500 rounded-2xl text-sm font-bold transition-all outline-none"
            />
          </div>

          {/* 본문 입력 */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-500 tracking-wider uppercase">본문 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 정성껏 입력하세요..."
              rows={10}
              className="w-full px-4 py-4 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-100 focus:border-blue-500 rounded-3xl text-sm font-medium transition-all outline-none resize-none leading-relaxed"
            />
          </div>

          {/* 중요 고정 토글 */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
            <div>
              <p className="text-xs font-bold text-slate-800">상단 중요 공지로 고정</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">선택 시 목록의 가장 최상단에 고정 노출됩니다.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                isPinned ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isPinned ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 파일 업로드 컴포넌트 */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-500 tracking-wider uppercase">
              첨부파일 ({files.length}/5)
            </label>
            
            {/* 드래그 앤 드롭 영역 */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50/30 text-blue-600' 
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/30 text-slate-400'
              }`}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs font-bold text-slate-700">파일을 끌어다 놓거나 클릭해 첨부하세요</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">파일 개당 최대 10MB, 최대 5개까지 가능</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
              />
            </div>

            {/* 업로드된 파일 리스트 */}
            {files.length > 0 && (
              <div className="grid gap-2 pt-2 animate-[fadeIn_0.2s_ease-out]">
                {files.map((file, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* 파일 서브아이콘 */}
                      <span className="text-base flex-shrink-0">📄</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="w-7 h-7 rounded-xl hover:bg-slate-200/50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 버튼 컨트롤 */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/notice')}
              disabled={isSubmitting}
              className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200/80 text-slate-600 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-2xl text-sm font-bold shadow-md shadow-blue-100 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  등록 중...
                </>
              ) : (
                '공지 등록'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
