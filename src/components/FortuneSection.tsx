'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface FortuneData {
  date: string;
  fortunes: Array<{
    number: string;
    name: string;
    title: string;
    description: string;
    imageUrl: string;
  }>;
}

export default function FortuneSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [fortuneData, setFortuneData] = useState<FortuneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFortune, setSelectedFortune] = useState<{
    number: string;
    name: string;
    title: string;
    description: string;
    imageUrl: string;
  } | null>(null);

  useEffect(() => {
    fetchFortuneData();
  }, []);

  const fetchFortuneData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/fortune');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API 응답 오류');
      }
      
      // 데이터 유효성 검사
      if (!data.fortunes || data.fortunes.length === 0) {
        throw new Error('운세 데이터가 없습니다.');
      }
      
      setFortuneData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  const handleZodiacClick = (fortune: {
    number: string;
    name: string;
    title: string;
    description: string;
    imageUrl: string;
  }) => {
    setSelectedFortune(fortune);
  };


  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-yellow-300 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            오늘의 운세
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-300">운세 데이터를 불러오는 중...</div>
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
                <Sparkles className="h-5 w-5 text-yellow-300" />
                오늘의 운세
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-yellow-300" />
              ) : (
                <ChevronDown className="h-5 w-5 text-yellow-300" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {error ? (
              <div className="text-center py-8 text-slate-400">
                운세 데이터를 불러올 수 없습니다: {error}
              </div>
            ) : fortuneData ? (
              <>
                <div className="mb-6">
                  <div className="text-center text-slate-300 text-sm mb-4">
                    {fortuneData.date} 오늘의 운세
                  </div>
                  
                  {/* 12개의 띠 그리드 (4x3) */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {fortuneData.fortunes.map((fortune) => (
                      <div
                        key={fortune.number}
                        className="flex flex-col items-center p-2 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-600/50 transition-colors"
                        onClick={() => handleZodiacClick(fortune)}
                      >
                        <div className="w-12 h-12 mb-2 flex items-center justify-center">
                          <div className="w-full h-full rounded-full overflow-hidden border-2 border-yellow-300/50 bg-slate-800 p-1 shadow-lg">
                            <img 
                              src={fortune.imageUrl} 
                              alt={fortune.name}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                // 이미지 로드 실패 시 기본 아이콘 표시
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center hidden">
                              <span className="text-white font-bold text-sm">
                                {fortune.number}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-white text-xs text-center">
                          {fortune.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* 선택된 운세 표시 */}
                  {selectedFortune && (
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                          <div className="w-full h-full rounded-full overflow-hidden border-2 border-yellow-300/70 bg-slate-800 p-1 shadow-lg">
                            <img 
                              src={selectedFortune.imageUrl} 
                              alt={selectedFortune.name}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                // 이미지 로드 실패 시 기본 아이콘 표시
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center hidden">
                              <span className="text-white font-bold text-lg">
                                {selectedFortune.number}
                              </span>
                            </div>
                          </div>
                        </div>
                        <h3 className="text-yellow-300 font-semibold text-lg mb-2">
                          {selectedFortune.name || '띠명 없음'}
                        </h3>
                        <h4 className="text-white font-medium text-sm mb-3">
                          {selectedFortune.title || '운세 제목을 불러올 수 없습니다.'}
                        </h4>
                      </div>
                      <div className="text-slate-300 leading-relaxed text-sm whitespace-pre-line">
                        {selectedFortune.description || '운세 내용을 불러올 수 없습니다.'}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-400">
                운세 데이터가 없습니다.
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

