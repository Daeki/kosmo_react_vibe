import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAPI } from '../utils/api';

export default function StockDetail() {
  const { code } = useParams();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blinkState, setBlinkState] = useState(null);
  const [showMockToast, setShowMockToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const prevPriceRef = useRef(null);

  const fetchStockDetail = async (isFirstLoad = false) => {
    try {
      const data = await fetchAPI(`/stocks/${code}`);
      
      if (!isFirstLoad && prevPriceRef.current !== null && prevPriceRef.current !== data.price) {
        // 가격 변동 감지
        setBlinkState(data.price > prevPriceRef.current ? 'up' : 'down');
        
        // 1초 뒤 blink 애니메이션 제거
        setTimeout(() => {
          setBlinkState(null);
        }, 1000);
      }

      prevPriceRef.current = data.price;
      setStock(data);
      setError(null);
    } catch (err) {
      console.error('주식 상세 조회 오류:', err);
      setError(err.message || '주식 정보를 불러올 수 없습니다.');
    } finally {
      if (isFirstLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStockDetail(true);

    const interval = setInterval(() => {
      fetchStockDetail(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [code]);

  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  const handleMockAction = (action) => {
    setToastMessage(`${stock.name} ${action} 기능은 준비 중입니다. (모의투자 마일스톤 확장 예정)`);
    setShowMockToast(true);
    setTimeout(() => setShowMockToast(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="text-slate-500 text-xs font-semibold">종목 정보를 로드하고 있습니다...</p>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="p-8 max-w-md mx-auto bg-white rounded-3xl shadow-sm mt-10 border border-slate-100 text-center">
        <div className="text-red-500 text-3xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">조회 실패</h2>
        <p className="text-slate-500 text-sm mb-6">{error || '존재하지 않는 종목코드입니다.'}</p>
        <Link
          to="/"
          className="py-3 px-6 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors inline-block"
        >
          시세 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  // SVG 차트 그리기 변수들 계산
  const history = stock.history || [];
  const minVal = Math.min(...history);
  const maxVal = Math.max(...history);
  const valRange = maxVal - minVal;

  const width = 600;
  const height = 240;
  const padding = 30;

  // 좌표 맵핑
  const points = history.map((val, idx) => {
    const x = padding + (idx / (history.length - 1)) * (width - padding * 2);
    // Y축 뒤집기 (값이 클수록 위에 그려야 하므로 Y좌표는 작아짐)
    const y = valRange === 0 
      ? height / 2 
      : height - padding - ((val - minVal) / valRange) * (height - padding * 2);
    return { x, y, val };
  });

  // SVG Path 생성 (꺾은선 그래프)
  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // SVG Gradient Area Path 생성 (채우기 영역)
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
    : '';

  const chartColor = stock.isRising ? '#EF4444' : '#3B82F6'; // 상승 빨강, 하락 파랑
  const blinkClass = blinkState === 'up' ? 'animate-blink-up' : blinkState === 'down' ? 'animate-blink-down' : '';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* 뒤로가기 링크 */}
      <div>
        <Link to="/" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          시세 목록
        </Link>
      </div>

      {/* 종목 요약 정보 */}
      <div className={`bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-colors duration-300 ${blinkClass}`}>
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{stock.name}</h1>
            <span className="text-sm font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">{stock.code}</span>
          </div>
          
          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-black text-slate-950 tracking-tight font-sans">
              {formatNumber(stock.price)}원
            </span>
            <span className={`text-base font-bold flex items-center gap-1 ${stock.isRising ? 'text-red-500' : 'text-blue-500'}`}>
              <span>{stock.isRising ? '▲' : '▼'}</span>
              <span>{formatNumber(stock.changePrice)}원</span>
              <span>({stock.isRising ? '+' : ''}{stock.changeRate}%)</span>
            </span>
          </div>
        </div>

        {/* 거래 버튼 (가상 기능) */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleMockAction('매수')}
            className="flex-1 md:flex-initial px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-sm transition-all shadow-sm active:scale-[0.98]"
          >
            구매하기
          </button>
          <button
            onClick={() => handleMockAction('매도')}
            className="flex-1 md:flex-initial px-6 py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold text-sm transition-all shadow-sm active:scale-[0.98]"
          >
            판매하기
          </button>
        </div>
      </div>

      {/* 기본적 분석 지표 (PER, PBR, EPS, BPS) */}
      {stock.per !== undefined && stock.per !== null && stock.per > 0 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-6">기본적 투자 지표 (Fundamental Metrics)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-400 block mb-1">PER (주가수익비율)</span>
              <span className="text-lg font-extrabold text-slate-800">{stock.per.toFixed(2)}배</span>
            </div>
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-400 block mb-1">PBR (주가순자산비율)</span>
              <span className="text-lg font-extrabold text-slate-800">{stock.pbr.toFixed(2)}배</span>
            </div>
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-400 block mb-1">EPS (주당순이익)</span>
              <span className="text-lg font-extrabold text-slate-800">{formatNumber(Math.round(stock.eps))}원</span>
            </div>
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-400 block mb-1">BPS (주당순자산가치)</span>
              <span className="text-lg font-extrabold text-slate-800">{formatNumber(Math.round(stock.bps))}원</span>
            </div>
          </div>
          <div className="mt-4 text-xs font-bold text-slate-400 leading-relaxed pl-1">
            * 저평가 지수(PER × PBR) = {(stock.per * stock.pbr).toFixed(2)} (지수가 낮을수록 내재가치 대비 주가가 저평가되어 있음을 나타냅니다.)
          </div>
        </div>
      )}

      {/* 7일 가격 추이 차트 */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-6">7일 가격 추이</h2>
        
        {/* SVG 컨테이너 */}
        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={chartColor} stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* 그리드 가로선 */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />

            {/* 채워진 그라데이션 영역 */}
            {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

            {/* 선 그래프 */}
            <path
              d={linePath}
              fill="none"
              stroke={chartColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 데이터 포인트 점 및 텍스트 가격 표시 */}
            {points.map((p, idx) => (
              <g key={idx} className="group">
                {/* 데이터 점 */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="white"
                  stroke={chartColor}
                  strokeWidth="3"
                  className="transition-all duration-150 hover:r-7 cursor-pointer"
                />
                
                {/* 툴팁/가격 표시 (Hover시 더 잘 보이고 평소엔 마지막 포인트 및 고/저점 위주로 살짝 노출) */}
                <text
                  x={p.x}
                  y={p.y - 12}
                  textAnchor="middle"
                  className="text-[10px] font-extrabold fill-slate-500 font-sans opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                >
                  {formatNumber(p.val)}
                </text>

                {/* 마지막 포인트(현재가)는 기본적으로 값을 표시 */}
                {idx === points.length - 1 && (
                  <text
                    x={p.x}
                    y={p.y - 14}
                    textAnchor="middle"
                    className="text-[10px] font-black fill-slate-800 font-sans"
                  >
                    현재 {formatNumber(p.val)}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* 7일 기간 라벨 */}
        <div className="flex justify-between mt-4 px-6 text-xs font-bold text-slate-400">
          <span>6일 전</span>
          <span>5일 전</span>
          <span>4일 전</span>
          <span>3일 전</span>
          <span>2일 전</span>
          <span>어제</span>
          <span className="text-slate-800">오늘 (실시간)</span>
        </div>
      </div>

      {/* 가상 주식 설명 카드 */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start space-x-4">
        <span className="text-xl">💡</span>
        <div className="text-sm text-slate-500 leading-relaxed font-semibold">
          <p className="text-slate-800 font-bold mb-1">상세 페이지 가이드</p>
          주식 가격은 3초마다 시장 상황 시뮬레이션을 통해 미세하게 출렁입니다. 1분마다 실제 증권사(한국투자증권) API로부터 얻은 현실 시세 기준값으로 자동 동기화 및 보정됩니다.
        </div>
      </div>

      {/* 모의 토스트 메시지 */}
      {showMockToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-bold text-sm px-6 py-4 rounded-2xl shadow-xl transition-all duration-300 animate-bounce">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
