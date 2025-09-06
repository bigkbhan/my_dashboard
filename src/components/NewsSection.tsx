'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, RefreshCw, Newspaper } from 'lucide-react';

interface NewsItem {
  id: string;
  category: string;
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
  summary: string;
}

interface CategoryNews {
  [key: string]: NewsItem[];
}

export default function NewsSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [displayCounts, setDisplayCounts] = useState<{ [key: string]: number }>({
    '정치': 5,
    '경제': 5,
    '사회': 5,
    '생활/문화': 5,
    'IT/과학': 5,
    '세계': 5
  });

  useEffect(() => {
    // 페이지 로드 시에만 초기 데이터 조회
    fetchNewsData();
  }, []); // 빈 의존성 배열로 초기 로드 시에만 실행

  const fetchNewsData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshMessage('뉴스 데이터를 조회하는 중...');
        setRefreshing(true);
        setNewsData([]);
        setError(null);

        setExpandedCategories(new Set()); // 카테고리 확장 상태 초기화 (모두 닫힌 상태)
        setDisplayCounts({
          '정치': 5,
          '경제': 5,
          '사회': 5,
          '생활/문화': 5,
          'IT/과학': 5,
          '세계': 5
        }); // 표시 개수 초기화
      }

      const response = await fetch('/api/news');
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error(`뉴스 API 응답 오류 (${response.status})`);
        }
      }

      if (data.news && Array.isArray(data.news)) {
        setNewsData(data.news);
        setError(null);
      } else {
        throw new Error('뉴스 데이터 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('뉴스 데이터 조회 실패:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('뉴스 데이터를 불러올 수 없습니다.');
      }
      setNewsData([]);
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
        setRefreshMessage(null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const toggleCategoryExpansion = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const openOriginalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const loadMoreNews = (category: string) => {
    setDisplayCounts(prev => ({
      ...prev,
      [category]: prev[category] + 5
    }));
  };

  const hasMoreNews = (category: string) => {
    const categoryNews = newsData.filter(news => news.category === category);
    return displayCounts[category] < categoryNews.length;
  };

  const getRemainingCount = (category: string) => {
    const categoryNews = newsData.filter(news => news.category === category);
    const remaining = categoryNews.length - displayCounts[category];
    return remaining > 0 ? remaining : 0;
  };

  const getCategoryNews = (category: string) => {
    return newsData.filter(news => news.category === category);
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-yellow-300" />
            오늘의 주요 뉴스
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-300">데이터를 불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
                   <CardHeader className="cursor-pointer hover:bg-slate-700/50 transition-colors">
           <CardTitle className="text-yellow-300 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Newspaper className="h-5 w-5 text-yellow-300" />
               <span>오늘의 주요 뉴스</span>
             </div>
             <div className="flex items-center gap-2">
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   fetchNewsData(true);
                 }}
                 className="p-1 hover:bg-slate-600/50 rounded transition-colors disabled:opacity-50"
                 title="새로고침"
                 disabled={refreshing}
               >
                 <RefreshCw size={16} className={`text-yellow-300 hover:text-yellow-200 ${refreshing ? 'animate-spin' : ''}`} />
               </button>
               {isOpen ? <ChevronUp size={20} className="text-yellow-300" /> : <ChevronDown size={20} className="text-yellow-300" />}
             </div>
           </CardTitle>
         </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* 새로고침 메시지 */}
            {refreshMessage && refreshing && (
              <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                <div className="text-blue-300 text-sm text-center">
                  <RefreshCw size={16} className="inline animate-spin mr-2" />
                  {refreshMessage}
                </div>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <div className="text-red-300 text-sm">
                  <strong>오류 발생:</strong> {error}
                </div>
              </div>
            )}

            {/* 뉴스 목록 */}
            {newsData.length > 0 ? (
              <div className="space-y-6">
                {['정치', '경제', '사회', '생활/문화', 'IT/과학', '세계'].map((category) => {
                  const categoryNews = getCategoryNews(category);
                  if (categoryNews.length === 0) return null;

                  return (
                    <div key={category} className="space-y-4">
                                             {/* 카테고리 제목 (토글 가능) */}
                       <div 
                         className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 cursor-pointer hover:bg-slate-600/50 transition-colors"
                         onClick={() => toggleCategoryExpansion(category)}
                       >
                         <div className="flex items-center justify-between">
                           <h3 className="text-white text-lg font-semibold">{category}</h3>
                           {expandedCategories.has(category) ? 
                             <ChevronUp size={20} className="text-slate-400" /> : 
                             <ChevronDown size={20} className="text-slate-400" />
                           }
                         </div>
                       </div>

                                             {/* 카테고리별 뉴스 (토글 상태에 따라 표시) */}
                       {expandedCategories.has(category) && (
                         <div className="space-y-4 bg-slate-800/30 rounded-lg p-4 border border-slate-600">
                          {categoryNews.slice(0, displayCounts[category]).map((news) => (
                            <div key={news.id} className="p-4 bg-slate-700/30 rounded-lg">
                              {/* 뉴스 제목과 출처 */}
                              <div className="mb-3">
                                <h3 
                                  className="text-white font-semibold text-lg mb-2 leading-tight cursor-pointer hover:text-blue-300 transition-colors"
                                  onClick={() => openOriginalLink(news.originallink)}
                                  title="클릭하여 원문 보기"
                                >
                                  {news.title}
                                </h3>
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                  <span>{formatDate(news.pubDate)}</span>
                                </div>
                              </div>

                              {/* 뉴스 내용 (요약만 표시) */}
                              <div className="mb-4">
                                <div className="text-slate-300 text-sm leading-relaxed">
                                  {news.summary}
                                </div>
                              </div>
                            </div>
                          ))}

                                                     {/* 카테고리별 더보기 버튼과 접기 버튼 */}
                           <div className="flex items-center justify-between">
                             {hasMoreNews(category) && (
                               <div className="text-center">
                                 <button
                                   onClick={() => loadMoreNews(category)}
                                   className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-colors"
                                 >
                                   {category} 더보기 ({getRemainingCount(category)}개 더)
                                 </button>
                               </div>
                             )}
                             
                             {/* 접기 버튼 */}
                             <button
                               onClick={() => toggleCategoryExpansion(category)}
                               className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded transition-colors"
                               title="그룹 접기"
                             >
                               <ChevronUp size={16} />
                               접기
                             </button>
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                {error ? '뉴스 데이터를 불러올 수 없습니다.' : '뉴스 데이터가 없습니다.'}
              </div>
            )}

            {/* 정보 출처 */}
            <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
              <div className="text-center text-slate-300 text-sm">
                <p>네이버 뉴스 API를 통해 제공되는 뉴스 정보</p>
                <p className="mt-1">실시간 주요 뉴스 • 최신순 정렬</p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
