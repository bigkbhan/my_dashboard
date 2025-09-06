'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronDown, ChevronUp, RefreshCw, Settings, Plus, Edit, Trash2, GripVertical, TrendingUp } from 'lucide-react';

interface StockData {
  symbol: string;
  companyName?: string;
  price: string;
  change: string;
  changePercent: string;
}

interface IndexData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
}

export default function StockSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [newStock, setNewStock] = useState({ symbol: '', companyName: '' });
  const [editingStock, setEditingStock] = useState<StockData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localStocks, setLocalStocks] = useState<StockData[]>([]);

  useEffect(() => {
    fetchStockData();
    // 백그라운드 자동 업데이트 제거 - 새로고침 시에만 데이터 업데이트
  }, []);

  useEffect(() => {
    setLocalStocks(stocks);
  }, [stocks]);

  const fetchStockData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshMessage('주식 데이터를 조회하는 중...');
        setRefreshing(true);
        // 새로고침 시 기존 데이터 클리어
        setIndices([]);
        setStocks([]);
        setError(null);
      }
      
      console.log('🔍 주식 데이터 조회 시작...');
      if (!isRefresh) {
        setError(null);
      }
      
      const response = await fetch('/api/stocks');
      console.log('📡 주식 API 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ 주식 API 오류 응답:', errorData);
        throw new Error(`API 응답 오류: ${response.status} - ${errorData.error || errorData.details || '알 수 없는 오류'}`);
      }
      
      const data = await response.json();
      console.log('📊 주식 API 응답 데이터:', data);
      console.log('📊 응답 데이터 구조:', {
        hasIndices: !!data.indices,
        indicesLength: data.indices?.length || 0,
        hasStocks: !!data.stocks,
        stocksLength: data.stocks?.length || 0,
        hasTimestamp: !!data.timestamp
      });
      
      if (data.indices) {
        console.log('📈 주요지수 데이터:', data.indices);
        const indicesData: IndexData[] = data.indices.map((item: {
          symbol: string;
          name: string;
          price: string;
          change: string;
          changePercent: string;
        }) => ({
          symbol: item.symbol,
          name: item.name,
          price: item.price,
          change: item.change,
          changePercent: item.changePercent
        }));
        setIndices(indicesData);
        console.log('✅ 주요지수 상태 업데이트 완료:', indicesData);
      } else {
        console.warn('⚠️ 주요지수 데이터가 없습니다.');
        setIndices([]);
      }
      
      if (data.stocks) {
        console.log('📈 주식 데이터:', data.stocks);
        const stocksData: StockData[] = data.stocks.map((item: {
          symbol: string;
          name: string;
          price: string;
          change: string;
          changePercent: string;
        }) => ({
          symbol: item.symbol,
          companyName: item.companyName,
          price: item.price,
          change: item.change,
          changePercent: item.changePercent
        }));
        setStocks(stocksData);
        console.log('✅ 주식 상태 업데이트 완료:', stocksData);
      } else {
        console.warn('⚠️ 주식 데이터가 없습니다.');
        setStocks([]);
      }
      
      console.log('🎯 최종 상태:', {
        indicesCount: data.indices?.length || 0,
        stocksCount: data.stocks?.length || 0
      });
      
    } catch (error) {
      console.error('💥 주식 데이터 조회 실패:', error);
      if (error instanceof Error) {
        console.error('💥 에러 상세:', {
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 5)
        });
        setError(error.message);
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
      setIndices([]);
      setStocks([]);
         } finally {
       setLoading(false);
       // 새로고침 상태 초기화
       if (isRefresh) {
         setRefreshing(false);
         setRefreshMessage(null);
       }
     }
  };

  const formatChange = (change: string) => {
    if (change === 'N/A') return 'N/A';
    const isPositive = change.startsWith('+');
    return (
      <span className={`${isPositive ? 'text-red-400' : 'text-blue-400'}`}>
        {change}
      </span>
    );
  };

  // 종목 관리 함수들
  const handleAddStock = async () => {
    try {
      const response = await fetch('/api/stocks/tickers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: newStock.symbol,
          company_name: newStock.companyName,
          sector: '',
          is_active: true
        }),
      });

      if (response.ok) {
        // 로컬 상태에 즉시 추가
        const newStockData: StockData = {
          symbol: newStock.symbol,
          companyName: newStock.companyName,
          price: '0.00',
          change: 'N/A',
          changePercent: 'N/A'
        };
        setLocalStocks([...localStocks, newStockData]);
        setNewStock({ symbol: '', companyName: '' });
      } else {
        console.error('종목 추가 실패');
      }
    } catch (error) {
      console.error('종목 추가 오류:', error);
    }
  };

  const handleEditStock = (stock: StockData) => {
    setEditingStock(stock);
    setNewStock({ symbol: stock.symbol, companyName: stock.companyName || '' });
  };

  const handleUpdateStock = async () => {
    if (!editingStock) return;
    
    try {
      const response = await fetch(`/api/stocks/tickers/${editingStock.symbol}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: newStock.companyName,
          sector: '',
          is_active: true
        }),
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setLocalStocks(localStocks.map(stock => 
          stock.symbol === editingStock.symbol 
            ? { ...stock, companyName: newStock.companyName }
            : stock
        ));
        setEditingStock(null);
        setNewStock({ symbol: '', companyName: '' });
      } else {
        console.error('종목 수정 실패');
      }
    } catch (error) {
      console.error('종목 수정 오류:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingStock(null);
    setNewStock({ symbol: '', companyName: '' });
  };

  const handleDeleteStock = async (symbol: string) => {
    if (!confirm(`${symbol} 종목을 삭제하시겠습니까?`)) return;
    
    try {
      const response = await fetch(`/api/stocks/tickers/${symbol}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 로컬 상태에서 즉시 제거
        setLocalStocks(localStocks.filter(stock => stock.symbol !== symbol));
      } else {
        console.error('종목 삭제 실패');
      }
    } catch (error) {
      console.error('종목 삭제 오류:', error);
    }
  };

  const handleReorderStocks = async (fromIndex: number, toIndex: number) => {
    const newStocks = [...localStocks];
    const [movedStock] = newStocks.splice(fromIndex, 1);
    newStocks.splice(toIndex, 0, movedStock);
    setLocalStocks(newStocks);

    // DB에 순서 변경 저장
    try {
      const response = await fetch('/api/stocks/tickers/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tickers: newStocks }),
      });

      if (!response.ok) {
        console.error('순서 변경 저장 실패');
      }
    } catch (error) {
      console.error('순서 변경 저장 오류:', error);
    }
  };

  const handleDialogClose = () => {
    // 창이 닫힐 때 Refresh 버튼과 동일한 동작 실행
    setIsDialogOpen(false);
    setEditingStock(null);
    setNewStock({ symbol: '', companyName: '' });
    
    // Refresh 버튼 클릭과 동일한 동작
    setRefreshMessage('주식 데이터를 조회하는 중...');
    setRefreshing(true);
    setIndices([]);
    setStocks([]);
    setError(null);
    
    // 실제 데이터 새로고침
    fetchStockData(true);
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-yellow-300" />
          미국주식 정보
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
                <span>미국주식 정보</span>
              </div>
              <div className="flex items-center gap-2">
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     fetchStockData(true);
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
            
            {/* 주요지수 */}
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-3">주요지수</h3>
              {indices.length > 0 ? (
                <div className="space-y-2">
                  {indices.map((index, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-4 p-3 bg-slate-700/50 rounded-lg items-center">
                      <div className="text-white font-medium text-xs truncate">
                        {index.name}
                      </div>
                      <div className="text-right">
                        <span className="text-white font-mono text-sm">
                          {parseFloat(index.price).toLocaleString()}
                        </span>
                      </div>
                                             <div className="text-right">
                         <div className="flex items-center justify-end gap-2">
                           <span className={`font-mono text-sm ${index.change === 'N/A' ? 'text-slate-400' : (index.change.startsWith('+') ? 'text-red-400' : 'text-blue-400')}`}>
                             {index.change === 'N/A' ? 'N/A' : (index.change.startsWith('+') ? '+' : '') + parseFloat(index.change.replace('+', '')).toLocaleString()}
                           </span>
                           <span className={`font-mono text-sm ${index.changePercent === 'N/A' ? 'text-slate-400' : (index.changePercent.startsWith('+') ? 'text-red-400' : 'text-blue-400')}`}>
                             {index.changePercent === 'N/A' ? 'N/A' : index.changePercent}
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
                        <DialogTitle>주요종목 관리</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* 종목 목록 */}
                        <div className="space-y-2">
                          <Label className="text-slate-300">현재 종목 목록 (드래그하여 순서 변경)</Label>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {localStocks.map((stock, idx) => (
                              <div 
                                key={stock.symbol} 
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
                                    handleReorderStocks(fromIndex, toIndex);
                                  }
                                }}
                              >
                                <GripVertical size={16} className="text-slate-400" />
                                <span className="flex-1 text-sm">{stock.companyName || stock.symbol}</span>
                                <span className="text-xs text-slate-400">{stock.symbol}</span>
                                <button
                                  onClick={() => handleEditStock(stock)}
                                  className="p-1 hover:bg-slate-600 rounded transition-colors"
                                  title="수정"
                                >
                                  <Edit size={14} className="text-slate-300" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStock(stock.symbol)}
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
                            {editingStock ? '종목 수정' : '새 종목 추가'}
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="newSymbol" className="text-xs text-slate-400">심볼</Label>
                              <Input
                                id="newSymbol"
                                placeholder="예: AAPL"
                                className="bg-slate-700 border-slate-600 text-white"
                                value={newStock.symbol}
                                onChange={(e) => setNewStock({...newStock, symbol: e.target.value.toUpperCase()})}
                                disabled={!!editingStock}
                              />
                            </div>
                            <div>
                              <Label htmlFor="newCompanyName" className="text-xs text-slate-400">회사명</Label>
                              <Input
                                id="newCompanyName"
                                placeholder="예: 애플"
                                className="bg-slate-700 border-slate-600 text-white"
                                value={newStock.companyName}
                                onChange={(e) => setNewStock({...newStock, companyName: e.target.value})}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {editingStock ? (
                              <>
                                <Button
                                  onClick={handleUpdateStock}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  disabled={!newStock.companyName}
                                >
                                  <Edit size={16} className="mr-1" />
                                  수정
                                </Button>
                                <Button
                                  onClick={handleCancelEdit}
                                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
                                >
                                  취소
                                </Button>
                              </>
                            ) : (
                              <Button
                                onClick={handleAddStock}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                disabled={!newStock.symbol || !newStock.companyName}
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
              {stocks.length > 0 ? (
                <div className="space-y-2">
                  {stocks.map((stock, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-4 p-3 bg-slate-700/50 rounded-lg items-center">
                      <div className="text-white font-medium text-xs truncate">
                        {stock.companyName || stock.symbol}
                      </div>
                      <div className="text-right">
                        <span className="text-white font-mono text-sm">
                          ${parseFloat(stock.price).toFixed(2)}
                        </span>
                      </div>
                                             <div className="text-right">
                         <div className="flex items-center justify-end gap-2">
                           <span className={`font-mono text-sm ${stock.change === 'N/A' ? 'text-slate-400' : (stock.change.startsWith('+') ? 'text-red-400' : 'text-blue-400')}`}>
                             {stock.change === 'N/A' ? 'N/A' : (stock.change.startsWith('+') ? '+' : '') + parseFloat(stock.change.replace('+', '')).toLocaleString()}
                           </span>
                           <span className={`font-mono text-sm ${stock.changePercent === 'N/A' ? 'text-slate-400' : (stock.changePercent.startsWith('+') ? 'text-red-400' : 'text-blue-400')}`}>
                             {stock.changePercent === 'N/A' ? 'N/A' : stock.changePercent}
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
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
