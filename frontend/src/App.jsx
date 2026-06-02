import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NoticeList from './pages/NoticeList';
import NoticeDetail from './pages/NoticeDetail';
import NoticeCreate from './pages/NoticeCreate';
import NoticeEdit from './pages/NoticeEdit';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-black text-blue-600 tracking-tight">toss stock</Link>
        <nav className="flex items-center space-x-6 text-sm font-semibold text-slate-600">
          <Link to="/board" className="hover:text-slate-900 transition-colors">게시판</Link>
          <Link to="/notice" className="hover:text-slate-900 transition-colors">공지사항</Link>
          {user ? (
            <div className="flex items-center gap-4 border-l border-slate-100 pl-6">
              <span className="text-slate-800 font-bold">{user.nickname}님</span>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all duration-150"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-l border-slate-100 pl-6">
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all duration-150 shadow-sm"
              >
                로그인
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-3xl shadow-sm mt-10 text-center border border-slate-50 transition-all duration-300 hover:shadow-md">
      <h1 className="text-3xl font-black text-blue-600 tracking-tight mb-2">Toss Stock Vibe</h1>
      <p className="text-sm text-slate-500 mb-6 font-medium">토스 스타일 주식 정보 및 커뮤니티 플랫폼</p>
      
      {user && (
        <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl text-sm text-blue-800 border border-blue-100/50">
          <span className="font-bold">{user.nickname}</span>님, 반가워요!
        </div>
      )}

      <div className="flex flex-col space-y-3">
        <Link to="/board" className="py-3.5 px-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-50 active:scale-[0.98]">
          자유게시판 가기
        </Link>
        <Link to="/notice" className="py-3.5 px-4 bg-slate-50 text-slate-700 border border-slate-200/60 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-colors active:scale-[0.98]">
          공지사항 가기
        </Link>
      </div>
    </div>
  );
};

const Board = () => (
  <div className="p-8 max-w-md mx-auto bg-white rounded-3xl shadow-sm mt-10 border border-slate-50">
    <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">자유게시판</h2>
    <p className="text-slate-500 text-sm mb-6">아직 작성된 글이 없습니다.</p>
    <Link to="/" className="text-blue-600 font-bold text-sm hover:underline">홈으로 돌아가기</Link>
  </div>
);



const MainLayout = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="text-slate-500 text-xs font-semibold">정보를 가져오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-10 w-full flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/board" element={<Board />} />
          <Route path="/notice" element={<NoticeList />} />
          <Route path="/notice/create" element={<NoticeCreate />} />
          <Route path="/notice/edit/:id" element={<NoticeEdit />} />
          <Route path="/notice/:id" element={<NoticeDetail />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
