'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, ExternalLink, Quote } from 'lucide-react';

interface QuoteData {
  id: string;
  text: string;
  author: string;
  source?: string;
  wikipedia?: string;
}

export default function QuoteSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchQuotes();
    }
  }, [isOpen]);

  const fetchQuotes = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`/api/quotes?date=${today}`);
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error(`명언 API 응답 오류 (${response.status})`);
        }
      }

      if (data.quotes && Array.isArray(data.quotes)) {
        setQuotes(data.quotes);
        setError(null);
      } else {
        throw new Error('명언 데이터 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('명언 데이터 조회 실패:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('명언을 불러올 수 없습니다.');
      }
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };



  const openWikipedia = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-yellow-300 flex items-center gap-2">
            <Quote className="h-5 w-5 text-yellow-300" />
            오늘의 명언
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
                <Quote className="h-5 w-5 text-yellow-300" />
                <span>오늘의 명언</span>
              </div>
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronUp size={20} className="text-yellow-300" /> : <ChevronDown size={20} className="text-yellow-300" />}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* 에러 메시지 */}
            {error && (
              <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <div className="text-red-300 text-sm">
                  <strong>오류 발생:</strong> {error}
                </div>
              </div>
            )}

            {/* 오늘의 명언 */}
            {quotes.length > 0 ? (
              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                {/* 명언 아이콘과 제목 */}
                <div className="flex items-center gap-2 mb-3">
                  <Quote size={20} className="text-yellow-300" />
                  <span className="text-yellow-300 text-sm font-medium">
                    오늘의 명언
                  </span>
                </div>

                {/* 명언 내용 */}
                <div className="mb-4">
                  <blockquote className="text-white text-lg leading-relaxed italic">
                    &ldquo;{quotes[0].text}&rdquo;
                  </blockquote>
                </div>

                {/* 작가 정보 */}
                <div className="flex items-center justify-between">
                  <div className="text-slate-300 text-sm">
                    <span className="font-medium">- {quotes[0].author}</span>
                    {quotes[0].source && (
                      <span className="text-slate-400 ml-2">
                        ({quotes[0].source})
                      </span>
                    )}
                  </div>

                  {/* 위키피디아 링크 */}
                  {quotes[0].wikipedia && (
                    <button
                      onClick={() => openWikipedia(quotes[0].wikipedia!)}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded transition-colors"
                      title="위키피디아에서 더 알아보기"
                    >
                      <ExternalLink size={14} />
                      더 알아보기
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                {error ? '명언을 불러올 수 없습니다.' : '명언 데이터가 없습니다.'}
              </div>
            )}

            {/* 정보 출처 */}
            <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
              <div className="text-center text-slate-300 text-sm">
                <p>api.sobabear.com을 통해 제공되는 명언 정보</p>
                <p className="mt-1">하루에 하나의 명언 • 매일 자정에 업데이트</p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
