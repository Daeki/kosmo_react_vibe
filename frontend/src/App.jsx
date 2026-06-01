import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const Home = () => (
  <div className="p-8 max-w-md mx-auto bg-white rounded-3xl shadow-sm mt-10 text-center transition-all duration-200 hover:shadow-md">
    <h1 className="text-3xl font-extrabold text-toss-blue mb-4">Toss Stock</h1>
    <p className="text-toss-gray-600 mb-6 font-medium">토스 스타일 주식 커뮤니티에 오신 것을 환영합니다.</p>
    <div className="flex flex-col space-y-3">
      <Link to="/board" className="py-3 px-4 bg-toss-blue text-white rounded-xl font-semibold hover:bg-toss-blue-hover transition-colors">자유게시판 가기</Link>
      <Link to="/notice" className="py-3 px-4 bg-toss-gray-100 text-toss-gray-800 rounded-xl font-semibold hover:bg-toss-gray-200 transition-colors">공지사항 가기</Link>
    </div>
  </div>
);

const Board = () => (
  <div className="p-8 max-w-md mx-auto bg-white rounded-3xl shadow-sm mt-10">
    <h2 className="text-2xl font-bold text-toss-gray-900 mb-4">자유게시판</h2>
    <p className="text-toss-gray-600 mb-6">아직 작성된 글이 없습니다.</p>
    <Link to="/" className="text-toss-blue font-semibold hover:underline">홈으로 돌아가기</Link>
  </div>
);

const Notice = () => (
  <div className="p-8 max-w-md mx-auto bg-white rounded-3xl shadow-sm mt-10">
    <h2 className="text-2xl font-bold text-toss-gray-900 mb-4">공지사항</h2>
    <p className="text-toss-gray-600 mb-6">첫 번째 공지사항이 준비 중입니다.</p>
    <Link to="/" className="text-toss-blue font-semibold hover:underline">홈으로 돌아가기</Link>
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-toss-gray-50 text-toss-gray-900">
        <header className="bg-white border-b border-toss-gray-200 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="text-xl font-extrabold text-toss-blue">toss stock</Link>
            <nav className="flex space-x-6 text-sm font-semibold text-toss-gray-600">
              <Link to="/board" className="hover:text-toss-gray-900 transition-colors">게시판</Link>
              <Link to="/notice" className="hover:text-toss-gray-900 transition-colors">공지사항</Link>
            </nav>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-6 py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/board" element={<Board />} />
            <Route path="/notice" element={<Notice />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
