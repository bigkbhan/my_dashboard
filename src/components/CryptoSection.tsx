'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronDown, ChevronUp, RefreshCw, Settings, Plus, Edit, Trash2, GripVertical, Coins } from 'lucide-react';

interface CryptoData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
}

interface MarketIndicators {
  fearGreedIndex: string;
  btcDominance: string;
  ethDominance: string;
}

export default function CryptoSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [indicators, setIndicators] = useState<MarketIndicators>({
    fearGreedIndex: '0',
    btcDominance: '0',
    ethDominance: '0'
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [newCrypto, setNewCrypto] = useState({ symbol: '', name: '' });
  const [editingCrypto, setEditingCrypto] = useState<CryptoData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localCryptos, setLocalCryptos] = useState<CryptoData[]>([]);

  useEffect(() => {
    fetchCryptoData();
    // 백그라운드 자동 업데이트 제거 - 새로고침 시에만 데이터 업데이트
  }, []);

  useEffect(() => {
    setLocalCryptos(cryptos);
  }, [cryptos]);

  const fetchCryptoData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshMessage('암호화폐 데이터를 조회하는 중...');
        setRefreshing(true);
        // 새로고침 시 기존 데이터 클리어
        setCryptos([]);
        setIndicators({
          fearGreedIndex: '0',
          btcDominance: '0',
          ethDominance: '0'
        });
      }
      
      const response = await fetch('/api/crypto');
      if (!response.ok) {
        throw new Error('API 응답 오류');
      }
      
      const data = await response.json();
      
             if (data.cryptos) {
         const cryptoData: CryptoData[] = data.cryptos
           .map((item: {
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
           }))
           .filter((crypto: CryptoData) => {
             // USD와 KRW 가격이 모두 0인 종목 제외
             const usdPrice = parseFloat(crypto.price);
             const krwPrice = usdPrice * 1320;
             return usdPrice > 0 && krwPrice > 0;
           });
         setCryptos(cryptoData);
       }
      
      if (data.indicators) {
        setIndicators(data.indicators);
      }
         } catch (error) {
       console.error('암호화폐 데이터 조회 실패:', error);
       setCryptos([]);
       setIndicators({
         fearGreedIndex: '0',
         btcDominance: '0%',
         ethDominance: '0%'
       });
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
    const isPositive = change.startsWith('+');
    return (
      <span className={`${isPositive ? 'text-red-400' : 'text-blue-400'}`}>
        {change}
      </span>
    );
  };

  const getFearGreedColor = (index: string) => {
    if (index === 'N/A') return 'text-slate-400';
    const num = parseInt(index);
    if (num >= 70) return 'text-green-400';
    if (num >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  // 암호화폐 가격 포맷팅 (API 결과값 그대로 + 천단위 콤마)
  const formatCryptoPrice = (price: number): string => {
    if (price >= 10000) {
      // 1만불 이상은 소수점 없이 표시
      return Math.round(price).toLocaleString('en-US');
    } else {
      // 1만불 미만은 소수점 2자리까지 표시
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };

  // KRW 가격 포맷팅 (API 결과값 그대로 + 천단위 콤마)
  const formatKRWPrice = (price: number): string => {
    return price.toLocaleString('ko-KR');
  };

  // 암호화폐 종목 관리 함수들
  const handleAddCrypto = async () => {
    try {
      const response = await fetch('/api/crypto/tickers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: newCrypto.symbol,
          name: newCrypto.name,
          is_active: true
        }),
      });

      if (response.ok) {
        // 로컬 상태에 즉시 추가
        const newCryptoData: CryptoData = {
          symbol: newCrypto.symbol,
          name: newCrypto.name,
          price: '0.00',
          change: 'N/A',
          changePercent: 'N/A'
        };
        setLocalCryptos([...localCryptos, newCryptoData]);
        setNewCrypto({ symbol: '', name: '' });
      } else {
        console.error('암호화폐 종목 추가 실패');
      }
    } catch (error) {
      console.error('암호화폐 종목 추가 오류:', error);
    }
  };

  const handleEditCrypto = (crypto: CryptoData) => {
    setEditingCrypto(crypto);
    setNewCrypto({ symbol: crypto.symbol, name: crypto.name });
  };

  const handleUpdateCrypto = async () => {
    if (!editingCrypto) return;
    
    try {
      const response = await fetch(`/api/crypto/tickers/${editingCrypto.symbol}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCrypto.name,
          is_active: true
        }),
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setLocalCryptos(localCryptos.map(crypto => 
          crypto.symbol === editingCrypto.symbol 
            ? { ...crypto, name: newCrypto.name }
            : crypto
        ));
        setEditingCrypto(null);
        setNewCrypto({ symbol: '', name: '' });
      } else {
        console.error('암호화폐 종목 수정 실패');
      }
    } catch (error) {
      console.error('암호화폐 종목 수정 오류:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingCrypto(null);
    setNewCrypto({ symbol: '', name: '' });
  };

  const handleDeleteCrypto = async (symbol: string) => {
    if (!confirm(`${symbol} 종목을 삭제하시겠습니까?`)) return;
    
    try {
      const response = await fetch(`/api/crypto/tickers/${symbol}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 로컬 상태에서 즉시 제거
        setLocalCryptos(localCryptos.filter(crypto => crypto.symbol !== symbol));
      } else {
        console.error('암호화폐 종목 삭제 실패');
      }
    } catch (error) {
      console.error('암호화폐 종목 삭제 오류:', error);
    }
  };

  const handleReorderCryptos = async (fromIndex: number, toIndex: number) => {
    const newCryptos = [...localCryptos];
    const [movedCrypto] = newCryptos.splice(fromIndex, 1);
    newCryptos.splice(toIndex, 0, movedCrypto);
    setLocalCryptos(newCryptos);

    // DB에 순서 변경 저장
    try {
      const response = await fetch('/api/crypto/tickers/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tickers: newCryptos }),
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
    setEditingCrypto(null);
    setNewCrypto({ symbol: '', name: '' });
    
    // Refresh 버튼 클릭과 동일한 동작
    setRefreshMessage('암호화폐 데이터를 조회하는 중...');
    setRefreshing(true);
    setCryptos([]);
    setIndicators({
      fearGreedIndex: '0',
      btcDominance: '0',
      ethDominance: '0'
    });
    
    // 실제 데이터 새로고침
    fetchCryptoData(true);
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-300" />
          암호화폐 정보
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
                <Coins className="h-5 w-5 text-yellow-300" />
                <span>암호화폐 정보</span>
              </div>
              <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchCryptoData(true);
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
            
            {/* 주요 지표 */}
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-3">주요 지표</h3>
              <div className="grid grid-cols-3 gap-4 p-3 bg-slate-700/50 rounded-lg">
                <div className="text-center">
                  <div className="text-slate-300 text-xs mb-1">공포탐욕지수</div>
                  <span className={`text-lg font-bold ${getFearGreedColor(indicators.fearGreedIndex)}`}>
                    {indicators.fearGreedIndex === 'N/A' ? 'N/A' : indicators.fearGreedIndex}
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-slate-300 text-xs mb-1">BTC 도미넌스</div>
                  <span className="text-lg font-bold text-white">
                    {indicators.btcDominance === 'N/A' ? 'N/A' : `${indicators.btcDominance}%`}
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-slate-300 text-xs mb-1">ETH 도미넌스</div>
                  <span className="text-lg font-bold text-white">
                    {indicators.ethDominance === 'N/A' ? 'N/A' : `${indicators.ethDominance}%`}
                  </span>
                </div>
              </div>
            </div>

                                       {/* 주요 종목 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-200">주요 종목</h3>
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
                        <DialogTitle>암호화폐 종목 관리</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* 종목 목록 */}
                        <div className="space-y-2">
                          <Label className="text-slate-300">현재 종목 목록 (드래그하여 순서 변경)</Label>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {localCryptos.map((crypto, idx) => (
                              <div 
                                key={crypto.symbol} 
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
                                    handleReorderCryptos(fromIndex, toIndex);
                                  }
                                }}
                              >
                                <GripVertical size={16} className="text-slate-400" />
                                <span className="flex-1 text-sm">{crypto.name}</span>
                                <span className="text-xs text-slate-400">{crypto.symbol}</span>
                                <button
                                  onClick={() => handleEditCrypto(crypto)}
                                  className="p-1 hover:bg-slate-600 rounded transition-colors"
                                  title="수정"
                                >
                                  <Edit size={14} className="text-slate-300" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCrypto(crypto.symbol)}
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
                            {editingCrypto ? '종목 수정' : '새 종목 추가'}
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="newCryptoSymbol" className="text-xs text-slate-400">심볼</Label>
                              <Input
                                id="newCryptoSymbol"
                                placeholder="예: BTC"
                                className="bg-slate-700 border-slate-600 text-white"
                                value={newCrypto.symbol}
                                onChange={(e) => setNewCrypto({...newCrypto, symbol: e.target.value.toUpperCase()})}
                                disabled={!!editingCrypto}
                              />
                            </div>
                            <div>
                              <Label htmlFor="newCryptoName" className="text-xs text-slate-400">이름</Label>
                              <Input
                                id="newCryptoName"
                                placeholder="예: 비트코인"
                                className="bg-slate-700 border-slate-600 text-white"
                                value={newCrypto.name}
                                onChange={(e) => setNewCrypto({...newCrypto, name: e.target.value})}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {editingCrypto ? (
                              <>
                                <Button
                                  onClick={handleUpdateCrypto}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  disabled={!newCrypto.name}
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
                                onClick={handleAddCrypto}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                disabled={!newCrypto.symbol || !newCrypto.name}
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
               {cryptos.length > 0 ? (
                 <div className="space-y-2">
                   {cryptos.map((crypto, idx) => (
                                                                <div key={idx} className="grid grid-cols-3 gap-8 p-3 bg-slate-700/50 rounded-lg items-center">
                       <div className="text-white font-medium text-xs truncate">
                         {crypto.name}
                       </div>
                                               <div className="text-right" style={{ marginRight: '15px' }}>
                          <div className="text-white font-mono text-sm">
                            ${formatCryptoPrice(parseFloat(crypto.price))}
                          </div>
                          <div className="text-slate-400 text-xs mt-1">
                            ₩{formatKRWPrice(parseFloat(crypto.price) * 1320)}
                          </div>
                        </div>
                                               <div className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`font-mono text-sm ${crypto.change.startsWith('+') ? 'text-red-400' : 'text-blue-400'}`}>
                              {crypto.change === 'N/A' ? 'N/A' : (crypto.change.startsWith('+') ? '+' : '') + parseFloat(crypto.change.replace('+', '')).toLocaleString()}
                            </span>
                            <span className={`font-mono text-sm ${crypto.change.startsWith('+') ? 'text-red-400' : 'text-blue-400'}`}>
                              {crypto.changePercent}
                            </span>
                          </div>
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8 text-slate-400">암호화폐 데이터를 불러올 수 없습니다.</div>
               )}
             </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
