import { Suspense } from 'react';
import StockSection from '@/components/StockSection';
import CryptoSection from '@/components/CryptoSection';
import ExchangeRateSection from '@/components/ExchangeRateSection';
import KoreanStockSection from '@/components/KoreanStockSection';
import WeatherSection from '@/components/WeatherSection';
import NewsSection from '@/components/NewsSection';
import QuoteSection from '@/components/QuoteSection';
import ConversationSection from '@/components/ConversationSection';
import FortuneSection from '@/components/FortuneSection';

export default function Home() {
    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-3 py-4 max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            bigkbhan&apos;s 대시보드
          </h1>
        </header>

        <div className="space-y-6">
          <Suspense fallback={<div className="text-center py-8 text-base">로딩 중...</div>}>
            <KoreanStockSection />
          </Suspense>
          
          <Suspense fallback={<div className="text-center py-8 text-base">로딩 중...</div>}>
            <StockSection />
          </Suspense>
          
          <Suspense fallback={<div className="text-center py-8 text-base">로딩 중...</div>}>
            <CryptoSection />
          </Suspense>
          
          <Suspense fallback={<div className="text-center py-8 text-base">로딩 중...</div>}>
            <ExchangeRateSection />
          </Suspense>
          
          <Suspense fallback={<div className="text-center py-8 text-base">로딩 중...</div>}>
            <WeatherSection />
          </Suspense>
          
          <Suspense fallback={<div className="text-center py-8 text-base">로딩 중...</div>}>
            <NewsSection />
          </Suspense>

          {/* 오늘의 명언 섹션 */}
          <Suspense fallback={<div className="text-center py-8 text-base">로딩 중...</div>}>
            <QuoteSection />
          </Suspense>

          {/* 오늘의 영어회화 섹션 */}
          <Suspense fallback={<div className="text-center py-8 text-base">로딩 중...</div>}>
            <ConversationSection />
          </Suspense>

          {/* 오늘의 운세 섹션 */}
          <Suspense fallback={<div className="text-center py-8 text-base">로딩 중...</div>}>
            <FortuneSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
