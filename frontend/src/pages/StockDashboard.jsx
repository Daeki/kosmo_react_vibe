import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAPI } from '../utils/api';

export default function StockDashboard() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 저평가 주식 관련 상태 추가
  const [undervaluedStocks, setUndervaluedStocks] = useState([]);
  const [activeTab, setActiveTab] = useState('popular'); // 'popular' | 'undervalued' | 'themes'
  
  // 테마 및 업종 관련 상태 추가
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [blinkStates, setBlinkStates] = useState({});
  const navigate = useNavigate();

  // 검색 드롭다운 관리 상태 및 Ref 추가
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // 이전 가격 기록용 레프
  const prevPricesRef = useRef({});

  const fetchStocksData = async (isFirstLoad = false) => {
    try {
      const data = await fetchAPI('/stocks');
      
      if (!isFirstLoad) {
        // 가격 변동 비교하여 blink 상태 기록
        const newBlinks = {};
        data.forEach((stock) => {
          const prevPrice = prevPricesRef.current[stock.code];
          if (prevPrice !== undefined && prevPrice !== stock.price) {
            newBlinks[stock.code] = stock.price > prevPrice ? 'up' : 'down';
          }
        });

        if (Object.keys(newBlinks).length > 0) {
          setBlinkStates((prev) => ({ ...prev, ...newBlinks }));
          
          // 1초 뒤 blink 애니메이션 초기화 (다시 실행될 수 있도록)
          setTimeout(() => {
            setBlinkStates((prev) => {
              const updated = { ...prev };
              Object.keys(newBlinks).forEach((code) => {
                updated[code] = null;
              });
              return updated;
            });
          }, 1000);
        }
      }

      // 가격 최신 기록 업데이트
      const prices = {};
      data.forEach((stock) => {
        prices[stock.code] = stock.price;
      });
      prevPricesRef.current = prices;

      setStocks(data);
      setError(null);
    } catch (err) {
      console.error('주식 데이터 조회 오류:', err);
      setError(err.message || '주식 데이터를 불러오는데 실패했습니다.');
    } finally {
      if (isFirstLoad) {
        setLoading(false);
      }
    }
  };

  // 저평가 주식 데이터 가져오기
  const fetchUndervaluedData = async (isFirstLoad = false) => {
    try {
      const data = await fetchAPI('/stocks/undervalued');
      setUndervaluedStocks(data);
    } catch (err) {
      console.error('저평가 주식 데이터 조회 오류:', err);
    }
  };

  // 테마 및 업종 데이터 가져오기
  const fetchThemesData = async () => {
    try {
      const data = await fetchAPI('/stocks/themes');
      setThemes(data);
      // 첫 로드 시 첫번째 테마를 디폴트 선택
      setSelectedTheme((prev) => prev || (data.length > 0 ? data[0] : null));
    } catch (err) {
      console.error('테마 및 업종 조회 오류:', err);
    }
  };

  useEffect(() => {
    // 최초 로드
    fetchStocksData(true);
    fetchUndervaluedData(true);
    fetchThemesData();

    // 3초 주기 폴링
    const interval = setInterval(() => {
      fetchStocksData(false);
      fetchThemesData();
    }, 3000);

    // 10초 주기 저평가 종목 폴링
    const undervaluedInterval = setInterval(() => {
      fetchUndervaluedData(false);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(undervaluedInterval);
    };
  }, []);

  // 외부 클릭 시 검색 추천 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 숫자 포맷 함수 (천단위 콤마)
  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  // 검색 필터링
  const filteredStocks = stocks.filter(
    (stock) =>
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.code.includes(searchTerm)
  );

  const filteredUndervalued = undervaluedStocks.filter(
    (stock) =>
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.code.includes(searchTerm)
  );

  // 검색어에 매칭되는 테마 필터링 (테마명, 설명 또는 테마내 종목명 매칭)
  const filteredThemes = themes.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.stocks.some((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.includes(searchTerm))
  );

  const currentTheme = themes.find((t) => t.name === selectedTheme?.name) || selectedTheme;

  // 드롭다운 노출용 필터링 (주식 최대 4개, 테마/업종 구분 최대 3개씩)
  const matchedStocksForDropdown = filteredStocks.slice(0, 4);
  const matchedThemesForDropdown = themes.filter((t) =>
    t.type === 'THEME' &&
    (t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     t.stocks.some((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.includes(searchTerm)))
  ).slice(0, 3);
  
  const matchedSectorsForDropdown = themes.filter((t) =>
    t.type === 'SECTOR' &&
    (t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     t.stocks.some((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.includes(searchTerm)))
  ).slice(0, 3);

  // 검색 전송 처리
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // 1. 주식 종목 매칭 최우선
    const matchedStock = filteredStocks[0];
    if (matchedStock) {
      navigate(`/stocks/${matchedStock.code}`);
      setShowDropdown(false);
      setSearchTerm('');
      return;
    }

    // 2. 테마/섹터 매칭 확인
    const matchedTheme = filteredThemes[0];
    if (matchedTheme) {
      setActiveTab('themes');
      setSelectedTheme(matchedTheme);
      setShowDropdown(false);
      setSearchTerm('');
      return;
    }
  };

  // 급등/급락 종목 추출을 위한 정렬 복사본
  const sortedByChange = [...stocks].sort((a, b) => b.changeRate - a.changeRate);
  const topGainer = sortedByChange.length > 0 ? sortedByChange[0] : null;
  const topLoser = sortedByChange.length > 0 ? sortedByChange[sortedByChange.length - 1] : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="text-slate-500 text-xs font-semibold">실시간 시세를 연결하고 있습니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-md mx-auto bg-white rounded-3xl shadow-sm mt-10 border border-slate-100 text-center">
        <div className="text-red-500 text-3xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">시세 연결 실패</h2>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <button
          onClick={() => fetchStocksData(true)}
          className="py-3 px-6 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors"
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 검색 & 소개 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">실시간 주식 시세</h1>
          <p className="text-sm text-slate-500 font-medium">한국투자증권 API와 실시간 시뮬레이션으로 연동된 가장 스마트한 시세 서비스</p>
        </div>
        
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80" ref={dropdownRef}>
          <input
            type="text"
            placeholder="종목, 테마 또는 업종 검색"
            value={searchTerm}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
          />
          <button
            type="submit"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* 통합 검색 자동완성 추천 드롭다운 */}
          {showDropdown && searchTerm.trim() !== '' && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto">
              {/* 주식 종목 */}
              {matchedStocksForDropdown.length > 0 && (
                <div className="p-3 border-b border-slate-50">
                  <div className="text-[10px] font-black text-slate-400 px-2.5 pb-1.5 tracking-wider">주식 종목</div>
                  <div className="space-y-0.5">
                    {matchedStocksForDropdown.map((stock) => (
                      <button
                        key={stock.code}
                        type="button"
                        onClick={() => {
                          navigate(`/stocks/${stock.code}`);
                          setShowDropdown(false);
                          setSearchTerm('');
                        }}
                        className="w-full text-left px-2.5 py-2 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">{stock.name}</span>
                          <span className="text-[10px] font-semibold text-slate-400">{stock.code}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-600">{formatNumber(stock.price)}원</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 주도 테마 */}
              {matchedThemesForDropdown.length > 0 && (
                <div className="p-3 border-b border-slate-50">
                  <div className="text-[10px] font-black text-purple-500 px-2.5 pb-1.5 tracking-wider">주도 테마</div>
                  <div className="space-y-0.5">
                    {matchedThemesForDropdown.map((theme) => (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() => {
                          setActiveTab('themes');
                          setSelectedTheme(theme);
                          setShowDropdown(false);
                          setSearchTerm('');
                        }}
                        className="w-full text-left px-2.5 py-2 hover:bg-slate-50 rounded-xl transition-colors flex flex-col"
                      >
                        <span className="text-xs font-bold text-slate-950">{theme.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold line-clamp-1">{theme.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 핵심 업종 */}
              {matchedSectorsForDropdown.length > 0 && (
                <div className="p-3">
                  <div className="text-[10px] font-black text-indigo-500 px-2.5 pb-1.5 tracking-wider">핵심 업종</div>
                  <div className="space-y-0.5">
                    {matchedSectorsForDropdown.map((sector) => (
                      <button
                        key={sector.name}
                        type="button"
                        onClick={() => {
                          setActiveTab('themes');
                          setSelectedTheme(sector);
                          setShowDropdown(false);
                          setSearchTerm('');
                        }}
                        className="w-full text-left px-2.5 py-2 hover:bg-slate-50 rounded-xl transition-colors flex flex-col"
                      >
                        <span className="text-xs font-bold text-slate-950">{sector.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold line-clamp-1">{sector.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 매칭 결과 없음 */}
              {matchedStocksForDropdown.length === 0 &&
                matchedThemesForDropdown.length === 0 &&
                matchedSectorsForDropdown.length === 0 && (
                  <div className="p-5 text-center text-xs font-bold text-slate-400">
                    일치하는 종목, 테마 또는 업종이 없습니다.
                  </div>
                )}
            </div>
          )}
        </form>
      </div>

      {/* 대시보드 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽: 실시간 인기 종목 순위 / 저평가 우량주 탭 */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-4 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('popular')}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all ${
                  activeTab === 'popular'
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                📈 인기 순위
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('undervalued')}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all ${
                  activeTab === 'undervalued'
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                🔍 저평가 우량주
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('themes')}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all ${
                  activeTab === 'themes'
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                🏷️ 테마 & 업종
              </button>
            </div>
            
            {activeTab === 'popular' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full animate-pulse">
                ● 실시간 거래량 기준
              </span>
            ) : activeTab === 'undervalued' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full animate-pulse">
                ● 밸류에이션(PER/PBR) 분석
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-500 bg-purple-50 px-2.5 py-1 rounded-full animate-pulse">
                ● 주도테마/업종 분류
              </span>
            )}
          </div>

          <div>
            {activeTab === 'popular' ? (
              <div className="divide-y divide-slate-50">
                {filteredStocks.length === 0 ? (
                  <div className="p-8">
                    <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 flex items-start space-x-3 text-left">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <p className="font-extrabold text-sm">경고: 검색된 주식 종목이 존재하지 않습니다.</p>
                        <p className="text-xs text-amber-600/90 mt-0.5">검색하신 이름이나 종목 코드가 올바른지 다시 한번 확인해 주세요.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  filteredStocks.map((stock, index) => {
                    const blink = blinkStates[stock.code];
                    const blinkClass = blink === 'up' ? 'animate-blink-up' : blink === 'down' ? 'animate-blink-down' : '';
                    
                    return (
                      <Link
                        key={stock.code}
                        to={`/stocks/${stock.code}`}
                        className={`flex items-center justify-between px-8 py-5 hover:bg-slate-50/70 transition-all duration-150 ${blinkClass}`}
                      >
                        <div className="flex items-center space-x-4">
                          <span className="text-base font-extrabold text-slate-400 w-5 text-center">
                            {index + 1}
                          </span>
                          <div>
                            <div className="text-base font-bold text-slate-900 tracking-tight">
                              {stock.name}
                            </div>
                            <div className="text-xs font-semibold text-slate-400">
                              {stock.code}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-extrabold text-slate-900 tracking-tight">
                            {formatNumber(stock.price)}원
                          </div>
                          <div
                            className={`text-xs font-bold flex items-center justify-end gap-1 ${
                              stock.isRising ? 'text-red-500' : 'text-blue-500'
                            }`}
                          >
                            <span>{stock.isRising ? '▲' : '▼'}</span>
                            <span>{formatNumber(stock.changePrice)}원</span>
                            <span className="bg-slate-50 px-1.5 py-0.5 rounded text-[10px] ml-1 font-extrabold">
                              {stock.isRising ? '+' : ''}{stock.changeRate}%
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            ) : activeTab === 'undervalued' ? (
              undervaluedStocks.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status">
                      <span className="sr-only">Analyzing...</span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-slate-955 font-black text-sm">기본적 분석 엔진 작동 중</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-semibold">
                        KIS API를 연동하여 후보 종목들의 PER 및 PBR을 대조 분석하고 있습니다. 첫 서버 기동 시 약 30초가 소요됩니다. 잠시만 기다려 주세요.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-50 text-xs font-bold text-slate-400 bg-slate-50/50">
                        <th className="px-8 py-4 text-center w-16">순위</th>
                        <th className="px-6 py-4">종목</th>
                        <th className="px-6 py-4 text-right">현재가</th>
                        <th className="px-6 py-4 text-right">PER</th>
                        <th className="px-6 py-4 text-right">PBR</th>
                        <th className="px-6 py-4 text-right text-right pr-8">저평가 지수</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUndervalued.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8">
                            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 flex items-start space-x-3 text-left">
                              <span className="text-xl">⚠️</span>
                              <div>
                                <p className="font-extrabold text-sm">경고: 검색된 주식 종목이 존재하지 않습니다.</p>
                                <p className="text-xs text-amber-600/90 mt-0.5">검색하신 이름이나 종목 코드가 올바른지 다시 한번 확인해 주세요.</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredUndervalued.map((stock, index) => {
                          const score = stock.undervaluationScore ? stock.undervaluationScore.toFixed(2) : '-';
                          return (
                            <tr
                              key={stock.code}
                              onClick={() => navigate(`/stocks/${stock.code}`)}
                              className="hover:bg-slate-50/70 transition-all duration-150 cursor-pointer"
                            >
                              <td className="px-8 py-5 text-center text-sm font-extrabold text-slate-400">
                                {index + 1}
                              </td>
                              <td className="px-6 py-5">
                                <div className="text-sm font-bold text-slate-900">{stock.name}</div>
                                <div className="text-xs font-semibold text-slate-400">{stock.code}</div>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <div className="text-sm font-extrabold text-slate-900">{formatNumber(stock.price)}원</div>
                                <div className={`text-xs font-bold flex items-center justify-end gap-1 ${stock.isRising ? 'text-red-500' : 'text-blue-500'}`}>
                                  <span>{stock.isRising ? '▲' : '▼'}</span>
                                  <span>{formatNumber(stock.changePrice)}원</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-right text-sm font-extrabold text-slate-600">
                                {stock.per && stock.per > 0 ? `${stock.per.toFixed(1)}배` : 'N/A'}
                              </td>
                              <td className="px-6 py-5 text-right text-sm font-extrabold text-slate-600">
                                {stock.pbr && stock.pbr > 0 ? `${stock.pbr.toFixed(2)}배` : 'N/A'}
                              </td>
                              <td className="px-6 py-5 text-right pr-8">
                                <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-600 font-black text-xs rounded-lg">
                                  {score}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              /* 테마 & 업종 탭 콘텐츠 */
              <div className="p-8 space-y-8">
                {/* 테마/업종 필터 결과 목록 */}
                {filteredThemes.length === 0 ? (
                  <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 flex items-start space-x-3 text-left">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="font-extrabold text-sm">경고: 검색 조건에 부합하는 테마 또는 업종이 없습니다.</p>
                      <p className="text-xs text-amber-600/90 mt-0.5">입력하신 검색어가 테마명, 설명 또는 포함된 종목의 이름에 해당하는지 확인해 주세요.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 가로 스크롤 카드 레이아웃 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredThemes.map((theme) => (
                        <button
                          key={theme.name}
                          type="button"
                          onClick={() => setSelectedTheme(theme)}
                          className={`p-5 rounded-2xl border text-left transition-all ${
                            currentTheme?.name === theme.name
                              ? 'bg-blue-50/40 border-blue-600 ring-2 ring-blue-600/10'
                              : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                              theme.type === 'THEME' 
                                ? 'bg-purple-50 text-purple-600' 
                                : 'bg-indigo-50 text-indigo-600'
                            }`}>
                              {theme.type === 'THEME' ? '주도 테마' : '핵심 업종'}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              종목 {theme.stocks.length}개
                            </span>
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm mb-1 tracking-tight">{theme.name}</h4>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-2">{theme.description}</p>
                        </button>
                      ))}
                    </div>

                    {/* 선택된 테마 내 구성 종목 리스트 테이블 */}
                    {currentTheme && (
                      <div className="bg-slate-50/40 rounded-2xl border border-slate-100 overflow-hidden mt-6">
                        <div className="p-6 bg-white border-b border-slate-100">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              currentTheme.type === 'THEME' 
                                ? 'bg-purple-50 text-purple-600' 
                                : 'bg-indigo-50 text-indigo-600'
                            }`}>
                              {currentTheme.type === 'THEME' ? '테마' : '업종'}
                            </span>
                            <h3 className="font-extrabold text-slate-950 text-base tracking-tight">{currentTheme.name}</h3>
                          </div>
                          <p className="text-xs text-slate-500 font-semibold">{currentTheme.description}</p>
                        </div>

                        <div className="overflow-x-auto bg-white">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-50 text-xs font-bold text-slate-400 bg-slate-50/50">
                                <th className="px-6 py-3 w-16 text-center">번호</th>
                                <th className="px-6 py-3">종목명</th>
                                <th className="px-6 py-3 text-right">현재가</th>
                                <th className="px-6 py-3 text-right">전일대비</th>
                                <th className="px-6 py-3 text-right pr-8">등락률</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {currentTheme.stocks.map((stock, idx) => {
                                const blink = blinkStates[stock.code];
                                const blinkClass = blink === 'up' ? 'animate-blink-up' : blink === 'down' ? 'animate-blink-down' : '';
                                return (
                                  <tr
                                    key={stock.code}
                                    onClick={() => navigate(`/stocks/${stock.code}`)}
                                    className={`hover:bg-slate-50/70 transition-all duration-150 cursor-pointer ${blinkClass}`}
                                  >
                                    <td className="px-6 py-4 text-center text-xs font-extrabold text-slate-400">
                                      {idx + 1}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm font-bold text-slate-900">{stock.name}</div>
                                      <div className="text-xs font-semibold text-slate-400">{stock.code}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-extrabold text-slate-900">
                                      {formatNumber(stock.price)}원
                                    </td>
                                    <td className={`px-6 py-4 text-right text-xs font-bold ${
                                      stock.isRising ? 'text-red-500' : 'text-blue-500'
                                    }`}>
                                      {stock.isRising ? '▲' : '▼'} {formatNumber(stock.changePrice)}원
                                    </td>
                                    <td className={`px-6 py-4 text-right text-xs font-extrabold pr-8 ${
                                      stock.isRising ? 'text-red-500' : 'text-blue-500'
                                    }`}>
                                      {stock.isRising ? '+' : ''}{stock.changeRate}%
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 급등/급락 종목 요약 */}
        <div className="space-y-8 lg:col-span-1">
          {/* 급등 카드 */}
          {topGainer && (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-48 relative overflow-hidden transition-all duration-300 hover:shadow-md">
              <div className="absolute right-0 top-0 w-32 h-32 bg-red-50/50 rounded-full blur-3xl -z-1"></div>
              <div>
                <span className="text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
                  오늘 가장 많이 오른
                </span>
                <h3 className="text-xl font-extrabold text-slate-950 mt-4 tracking-tight">
                  {topGainer.name}
                </h3>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-lg font-extrabold text-slate-900 font-sans">
                  {formatNumber(topGainer.price)}원
                </span>
                <span className="text-base font-extrabold text-red-500">
                  +{topGainer.changeRate}%
                </span>
              </div>
              <Link
                to={`/stocks/${topGainer.code}`}
                className="absolute inset-0 z-10"
              />
            </div>
          )}

          {/* 급락 카드 */}
          {topLoser && (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-48 relative overflow-hidden transition-all duration-300 hover:shadow-md">
              <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -z-1"></div>
              <div>
                <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full">
                  오늘 가장 많이 내린
                </span>
                <h3 className="text-xl font-extrabold text-slate-950 mt-4 tracking-tight">
                  {topLoser.name}
                </h3>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <span className="text-lg font-extrabold text-slate-900 font-sans">
                  {formatNumber(topLoser.price)}원
                </span>
                <span className="text-base font-extrabold text-blue-500">
                  {topLoser.changeRate}%
                </span>
              </div>
              <Link
                to={`/stocks/${topLoser.code}`}
                className="absolute inset-0 z-10"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
