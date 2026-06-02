import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../utils/api';

export default function NoticeEdit() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [deleteAttachmentIds, setDeleteAttachmentIds] = useState([]);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // 어드민 권한 체크 가드
  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'ROLE_ADMIN') {
        alert('공지사항 수정 권한이 없습니다.');
        navigate('/notice');
      }
    }
  }, [user, loading, navigate]);

  // 공지 정보 패칭
  const loadNoticeDetail = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchAPI(`/notices/${id}`);
      if (data.authorEmail && user && user.email !== data.authorEmail) {
        alert('본인이 작성한 공지사항만 수정할 수 있습니다.');
        navigate(`/notice/${id}`);
        return;
      }
      setTitle(data.title || '');
      setContent(data.content || '');
      setIsPinned(data.isPinned || false);
      setExistingAttachments(data.attachments || []);
    } catch (err) {
      setError(err.message || '공지사항을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNoticeDetail();
  }, [id]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFilesToList(selectedFiles);
  };

  const addFilesToList = (newFiles) => {
    const activeExistingCount = existingAttachments.length - deleteAttachmentIds.length;
    if (activeExistingCount + files.length + newFiles.length > 5) {
      alert('첨부파일은 최대 5개까지만 유지할 수 있습니다.');
      return;
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveNewFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveExistingFile = (attachmentId) => {
    setDeleteAttachmentIds((prev) => [...prev, attachmentId]);
  };

  const handleUndoRemoveExistingFile = (attachmentId) => {
    setDeleteAttachmentIds((prev) => prev.filter((id) => id !== attachmentId));
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
      
      // 삭제할 기존 파일 ID 목록 추가
      deleteAttachmentIds.forEach((attId) => {
        formData.append('deleteAttachmentIds', attId);
      });

      // 새로 추가할 신규 파일들 추가
      files.forEach((file) => {
        formData.append('files', file);
      });

      await fetchAPI(`/notices/${id}`, {
        method: 'PUT',
        body: formData,
      });

      navigate(`/notice/${id}`);
    } catch (err) {
      setError(err.message || '공지사항 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-24 flex flex-col items-center justify-center">
        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status">
          <span className="sr-only">Loading notice data...</span>
        </div>
      </div>
    );
  }

  const activeExistingCount = existingAttachments.length - deleteAttachmentIds.length;
  const currentTotalCount = activeExistingCount + files.length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* 뒤로 가기 */}
      <div className="flex items-center">
        <button 
          onClick={() => navigate(`/notice/${id}`)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          상세 화면으로
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">공지사항 수정</h1>
          <p className="text-xs text-slate-400 mt-1">공지사항 내용을 변경하거나 첨부파일을 관리합니다.</p>
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
              placeholder="내용을 입력하세요..."
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
          <div className="space-y-4">
            <label className="text-xs font-extrabold text-slate-500 tracking-wider uppercase">
              첨부파일 ({currentTotalCount}/5)
            </label>
            
            {/* 기존 첨부파일 목록 */}
            {existingAttachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider">기존 첨부파일 목록</p>
                <div className="grid gap-2">
                  {existingAttachments.map((file) => {
                    const isDeleted = deleteAttachmentIds.includes(file.id);
                    return (
                      <div 
                        key={file.id}
                        className={`flex items-center justify-between p-3.5 border rounded-2xl transition-all ${
                          isDeleted 
                            ? 'bg-red-50/40 border-red-100 opacity-60 line-through' 
                            : 'bg-slate-50/40 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base flex-shrink-0">📄</span>
                          <div className="min-w-0">
                            <p className={`text-xs font-bold ${isDeleted ? 'text-red-700' : 'text-slate-700'} truncate`}>
                              {file.originalFileName}
                            </p>
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                              {formatFileSize(file.fileSize)}
                            </p>
                          </div>
                        </div>
                        {isDeleted ? (
                          <button
                            type="button"
                            onClick={() => handleUndoRemoveExistingFile(file.id)}
                            className="px-2.5 py-1 bg-white border border-red-200 text-red-600 rounded-xl text-[10px] font-extrabold hover:bg-red-50 transition-colors"
                          >
                            삭제 취소
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingFile(file.id)}
                            className="w-7 h-7 rounded-xl hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 신규 파일 추가 드래그 앤 드롭 */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 tracking-wider">신규 파일 추가</p>
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
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">파일 개당 최대 10MB, 총합 5개 이하로 유지 가능</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                />
              </div>
            </div>

            {/* 신규 업로드 대기 파일 리스트 */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider">추가 대기 파일</p>
                <div className="grid gap-2">
                  {files.map((file, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 bg-blue-50/10 border border-blue-100/50 rounded-2xl animate-[fadeIn_0.2s_ease-out]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base flex-shrink-0">📄</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-blue-900 truncate">{file.name}</p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(idx)}
                        className="w-7 h-7 rounded-xl hover:bg-blue-50 flex items-center justify-center text-blue-400 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 버튼 컨트롤 */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/notice/${id}`)}
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
                  수정 중...
                </>
              ) : (
                '수정 완료'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
