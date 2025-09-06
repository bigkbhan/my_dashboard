'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronDown, ChevronUp, RefreshCw, Settings, Plus, Edit, Trash2, GripVertical, TrendingUp } from 'lucide-react';

interface KoreanStockData {
  indices: Array<{
    name: string;
    code: string;
    price: number;
    change: number;
    changePercent: number;
  }>;
  stocks: Array<{
    name: string;
    code: string;
    price: number;
    change: number;
    changePercent: number;
    trend: string;
  }>;
  timestamp: string;
}

interface KoreanStockTicker {
  id: string;
  ticker_code: string;
  ticker_name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function KoreanStockSection() {
  const [stockData, setStockData] = useState<KoreanStockData | null>(null);
  const [tickers, setTickers] = useState<KoreanStockTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTicker, setEditingTicker] = useState<KoreanStockTicker | null>(null);
  const [newTickerCode, setNewTickerCode] = useState('');
  const [newTickerName, setNewTickerName] = useState('');

  // 한국주식 데이터 조회
  const fetchKoreanStockData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshMessage('한국주식 데이터를 조회하는 중...');
        setRefreshing(true);
        setStockData(null);
        setError(null);
      }
      
      console.log('🔍 한국주식 데이터 조회 시작...');
      if (!isRefresh) {
        setError(null);
      }
      
      const response = await fetch('/api/korean-stocks');
      console.log('📡 한국주식 API 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ 한국주식 API 오류 응답:', errorData);
        throw new Error(`API 응답 오류: ${response.status} - ${errorData.error || errorData.details || '알 수 없는 오류'}`);
      }
      
      const data = await response.json();
      console.log('📊 한국주식 API 응답 데이터:', data);
      
      setStockData(data);
    } catch (error) {
      console.error('한국주식 데이터 조회 실패:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
        setRefreshMessage(null);
      }
    }
  };

  // 한국주식 티커 목록 조회
  const fetchTickers = async () => {
    try {
      const response = await fetch('/api/korean-stocks/tickers');
      if (!response.ok) {
        throw new Error('티커 목록을 가져오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setTickers(data);
    } catch (error) {
      console.error('티커 목록 조회 실패:', error);
    }
  };

  // 한국주식 티커 추가
  const addTicker = async () => {
    try {
      const response = await fetch('/api/korean-stocks/tickers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker_code: newTickerCode,
          ticker_name: newTickerName
        })
      });

      if (!response.ok) {
        throw new Error('티커 추가에 실패했습니다.');
      }

      setNewTickerCode('');
      setNewTickerName('');
      await fetchTickers();
    } catch (error) {
      console.error('티커 추가 실패:', error);
    }
  };

  // 한국주식 티커 수정
  const updateTicker = async () => {
    if (!editingTicker) return;

    try {
      const response = await fetch('/api/korean-stocks/tickers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTicker.id,
          ticker_code: newTickerCode,
          ticker_name: newTickerName,
          is_active: editingTicker.is_active
        })
      });

      if (!response.ok) {
        throw new Error('티커 수정에 실패했습니다.');
      }

      setEditingTicker(null);
      setNewTickerCode('');
      setNewTickerName('');
      await fetchTickers();
    } catch (error) {
      console.error('티커 수정 실패:', error);
    }
  };

  // 한국주식 티커 삭제
  const deleteTicker = async (id: string) => {
    try {
      const response = await fetch(`/api/korean-stocks/tickers?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('티커 삭제에 실패했습니다.');
      }

      await fetchTickers();
    } catch (error) {
      console.error('티커 삭제 실패:', error);
    }
  };

  // 한국주식 티커 순서 변경
  const reorderTickers = async (tickerIds: string[]) => {
    try {
      const response = await fetch('/api/korean-stocks/tickers/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickerIds })
      });

      if (!response.ok) {
        throw new Error('티커 순서 변경에 실패했습니다.');
      }

      await fetchTickers();
    } catch (error) {
      console.error('티커 순서 변경 실패:', error);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchKoreanStockData();
    fetchTickers();
  }, []);

  // 등락 색상 결정 (trend 기반)
  const getChangeColor = (trend: string) => {
    if (trend === '상승') return 'text-red-500';
    if (trend === '하락') return 'text-blue-500';
    return 'text-white'; // 보합
  };

  // 지수용 등락 색상 결정 (change 기반)
  const getIndexChangeColor = (change: number) => {
    if (change > 0) return 'text-red-500';
    if (change < 0) return 'text-blue-500';
    return 'text-white'; // 보합
  };

  // 숫자 포맷팅
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  // 등락률 포맷팅
  const formatChangePercent = (percent: number) => {
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  // 다이얼로그 닫기 처리
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTicker(null);
    setNewTickerCode('');
    setNewTickerName('');
    // 설정창이 닫힐 때 한국주식 데이터 새로고침
    fetchKoreanStockData(true);
  };

  // 티커 수정 처리
  const handleEditTicker = (ticker: KoreanStockTicker) => {
    setEditingTicker(ticker);
    setNewTickerCode(ticker.ticker_code);
    setNewTickerName(ticker.ticker_name);
  };

  // 티커 순서 변경 처리
  const handleReorderTickers = (fromIndex: number, toIndex: number) => {
    const newTickers = [...tickers];
    const [movedTicker] = newTickers.splice(fromIndex, 1);
    newTickers.splice(toIndex, 0, movedTicker);
    setTickers(newTickers);
    
    // DB에 순서 변경 저장
    const tickerIds = newTickers.map(ticker => ticker.id);
    reorderTickers(tickerIds);
  };

  if (loading && !stockData) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-yellow-300 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-300" />
            <span>한국주식 정보</span>
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
                <TrendingUp className="h-5 w-5 text-yellow-300" />
                <span>한국주식 정보</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchKoreanStockData(true);
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
          <CardContent className="space-y-6">
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
            
            {stockData && !loading && !error && (
              <>
                {/* 주요지수 */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-3">주요지수</h3>
                  {stockData.indices.length > 0 ? (
                    <div className="space-y-2">
                      {stockData.indices.map((index) => (
                        <div key={index.code} className="grid grid-cols-3 gap-4 p-3 bg-slate-700/50 rounded-lg items-center">
                          <div className="text-white font-medium text-xs truncate">
                            {index.name}
                          </div>
                          <div className="text-right">
                            <span className="text-white font-mono text-sm">
                              {formatNumber(index.price)}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`font-mono text-sm ${getIndexChangeColor(index.change)}`}>
                                {formatNumber(index.change)}
                              </span>
                              <span className={`font-mono text-sm ${getIndexChangeColor(index.change)}`}>
                                {formatChangePercent(index.changePercent)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      {error ? '주요지수 데이터를 불러올 수 없습니다.' : '주요지수 데이터가 없습니다.'}
                    </div>
                  )}
                </div>
                
                {/* 주요종목 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-200">주요종목</h3>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                      if (!open) {
                        handleDialogClose();
                      } else {
                        setIsDialogOpen(true);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-slate-300 hover:text-white hover:bg-slate-600/50"
                        >
                          <Settings size={16} className="mr-1" />
                          설정
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <DialogHeader>
                          <DialogTitle>한국주식 종목 관리</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* 종목 목록 */}
                          <div className="space-y-2">
                            <Label className="text-slate-300">현재 종목 목록 (드래그하여 순서 변경)</Label>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {tickers.map((ticker, idx) => (
                                <div 
                                  key={ticker.id} 
                                  className="flex items-center gap-2 p-2 bg-slate-700/50 rounded cursor-move hover:bg-slate-600/50"
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', idx.toString());
                                  }}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                    const toIndex = idx;
                                    if (fromIndex !== toIndex) {
                                      handleReorderTickers(fromIndex, toIndex);
                                    }
                                  }}
                                >
                                  <GripVertical size={16} className="text-slate-400" />
                                  <span className="flex-1 text-sm">{ticker.ticker_name}</span>
                                  <span className="text-xs text-slate-400">{ticker.ticker_code}</span>
                                                                     <button
                                     onClick={() => handleEditTicker(ticker)}
                                     className="p-1 hover:bg-slate-600 rounded transition-colors"
                                     title="수정"
                                   >
                                     <Edit size={14} className="text-slate-300" />
                                   </button>
                                   <button
                                     onClick={() => deleteTicker(ticker.id)}
                                     className="p-1 hover:bg-slate-600 rounded transition-colors"
                                     title="삭제"
                                   >
                                     <Trash2 size={14} className="text-slate-300" />
                                   </button>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* 종목 추가/수정 */}
                          <div className="space-y-2">
                            <Label className="text-slate-300">
                              {editingTicker ? '종목 수정' : '새 종목 추가'}
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor="newTickerCode" className="text-xs text-slate-400">티커 코드</Label>
                                <Input
                                  id="newTickerCode"
                                  placeholder="예: 005930"
                                  className="bg-slate-700 border-slate-600 text-white"
                                  value={newTickerCode}
                                  onChange={(e) => setNewTickerCode(e.target.value)}
                                  disabled={!!editingTicker}
                                />
                              </div>
                              <div>
                                <Label htmlFor="newTickerName" className="text-xs text-slate-400">종목명</Label>
                                <Input
                                  id="newTickerName"
                                  placeholder="예: 삼성전자"
                                  className="bg-slate-700 border-slate-600 text-white"
                                  value={newTickerName}
                                  onChange={(e) => setNewTickerName(e.target.value)}
                                />
                              </div>
                            </div>
                                                         <div className="flex gap-2">
                               {editingTicker ? (
                                 <>
                                   <Button
                                     onClick={updateTicker}
                                     className="flex-1 bg-green-600 hover:bg-green-700"
                                     disabled={!newTickerName}
                                   >
                                     <Edit size={16} className="mr-1" />
                                     수정
                                   </Button>
                                   <Button
                                     onClick={() => {
                                       setEditingTicker(null);
                                       setNewTickerCode('');
                                       setNewTickerName('');
                                     }}
                                     className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
                                   >
                                     취소
                                   </Button>
                                 </>
                               ) : (
                                 <Button
                                   onClick={addTicker}
                                   className="w-full bg-blue-600 hover:bg-blue-700"
                                   disabled={!newTickerCode || !newTickerName}
                                 >
                                   <Plus size={16} className="mr-1" />
                                   종목 추가
                                 </Button>
                               )}
                             </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {stockData.stocks.length > 0 ? (
                    <div className="space-y-2">
                      {stockData.stocks.map((stock) => (
                        <div key={stock.code} className="grid grid-cols-3 gap-4 p-3 bg-slate-700/50 rounded-lg items-center">
                          <div className="text-white font-medium text-xs truncate">
                            {stock.name}
                          </div>
                          <div className="text-right">
                            <span className="text-white font-mono text-sm">
                              {formatNumber(stock.price)}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`font-mono text-sm ${getChangeColor(stock.trend)}`}>
                                {formatNumber(stock.change)}
                              </span>
                              <span className={`font-mono text-sm ${getChangeColor(stock.trend)}`}>
                                {formatChangePercent(stock.changePercent)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      {error ? '주요종목 데이터를 불러올 수 없습니다.' : '주요종목 데이터가 없습니다.'}
                    </div>
                  )}
                </div>
                
                
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
