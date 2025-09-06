'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, DollarSign, JapaneseYen, RefreshCw } from 'lucide-react';

interface ExchangeRateData {
  currency: string;
  rate: string;
  change: string;
  changePercent: string;
  lastUpdate: string;
}

export default function ExchangeRateSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchExchangeRateData();
    // 백그라운드 자동 업데이트 제거 - 새로고침 시에만 데이터 업데이트
  }, []);

           const fetchExchangeRateData = async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshMessage('환율 데이터를 조회하는 중...');
          setRefreshing(true);
          // 새로고침 시 기존 데이터 클리어
          setExchangeRates([]);
        }
        
        const response = await fetch('/api/exchange-rates');
       const data = await response.json();
       
       console.log('환율 API 응답:', data); // 디버깅용 로그 추가
       
       if (!response.ok) {
         // API 오류 응답 처리
         if (data.error) {
           throw new Error(data.error);
         } else {
           throw new Error('API 응답 오류');
         }
       }
      
             if (data.rates) {
         const rateData: ExchangeRateData[] = data.rates.map((item: {
           currency: string;
           rate: string;
           change: string;
           changePercent: string;
           lastUpdate?: string;
         }) => ({
           currency: item.currency,
           rate: item.rate,
           change: item.change,
           changePercent: item.changePercent,
           lastUpdate: item.lastUpdate || new Date().toLocaleTimeString('ko-KR')
         }));
         setExchangeRates(rateData);
       } else {
         throw new Error('환율 데이터가 없습니다.');
       }
    } catch (error) {
      console.error('환율 데이터 조회 실패:', error);
      setExchangeRates([]);
         } finally {
       setLoading(false);
       // 새로고침 상태 초기화
       if (isRefresh) {
         setRefreshing(false);
         setRefreshMessage(null);
       }
     }
  };


  const getCurrencyIcon = (currency: string) => {
    if (currency.includes('USD')) {
      return <DollarSign size={20} className="text-green-400" />;
    } else if (currency.includes('JPY')) {
      return <JapaneseYen size={20} className="text-red-400" />;
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-yellow-300" />
          환율 정보
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
                <DollarSign className="h-5 w-5 text-yellow-300" />
                <span>환율 정보</span>
              </div>
              <div className="flex items-center gap-2">
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     fetchExchangeRateData(true);
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
            
            <div className="text-sm text-slate-400 text-center mb-4">
              마지막 업데이트: {exchangeRates[0]?.lastUpdate}
            </div>
            
                         {exchangeRates.length > 0 ? (
               <div className="space-y-3">
                 {exchangeRates.map((rate, idx) => (
                   <div key={idx} className="p-3 bg-slate-700/50 rounded-lg">
                     <div className="grid grid-cols-3 gap-4 items-center">
                       <div className="flex items-center gap-2">
                         {getCurrencyIcon(rate.currency)}
                         <span className="text-white font-semibold text-sm">{rate.currency}</span>
                       </div>
                       <div className="text-right">
                         <div className="text-white font-mono text-sm">
                           {parseFloat(rate.rate).toLocaleString()}
                         </div>
                       </div>
                                                    <div className="text-right">
                               <div className="flex items-center justify-end gap-2">
                                 <span className={`font-mono text-sm ${rate.change === 'N/A' ? 'text-slate-400' : (rate.change.startsWith('+') ? 'text-red-400' : 'text-blue-400')}`}>
                                   {rate.change}
                                 </span>
                                 <span className={`font-mono text-sm ${rate.changePercent === 'N/A' ? 'text-slate-400' : (rate.changePercent.startsWith('+') ? 'text-red-400' : 'text-blue-400')}`}>
                                   {rate.changePercent}
                                 </span>
                               </div>
                             </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-8 text-slate-400">환율 데이터를 불러올 수 없습니다.</div>
             )}
            
                         <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
               <div className="text-center text-slate-300 text-sm">
                                   <p>ExchangeRate-API를 통해 제공되는 환율 정보</p>
                 <p className="mt-1">USD/KRW: 미국 달러 대비 원화 환율</p>
                 <p className="mt-1">100JPY/KRW: 100엔 대비 원화 환율</p>
               </div>
             </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
