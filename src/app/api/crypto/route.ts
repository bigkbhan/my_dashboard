import { NextResponse } from 'next/server';
import { getCryptoTickers } from '@/lib/db';

export async function GET() {
  try {
    console.log('🚀 CoinMarketCap API로 암호화폐 정보 조회 시작');
    
    // 데이터베이스에서 암호화폐 Ticker 목록 가져오기
    const cryptoTickers = await getCryptoTickers();
    console.log('데이터베이스에서 가져온 암호화폐 Tickers:', cryptoTickers);
    
         // API 키가 없거나 데이터베이스에 Ticker가 없으면 오류 반환
     if (!process.env.COINMARKETCAP_API_KEY) {
       console.log('⚠️ CoinMarketCap API 키가 설정되지 않음');
       return NextResponse.json(
         { error: 'CoinMarketCap API 키가 설정되지 않았습니다.' },
         { status: 500 }
       );
     }
     
     if (cryptoTickers.length === 0) {
       console.log('⚠️ 데이터베이스에 암호화폐 Ticker가 없음');
       return NextResponse.json(
         { error: '데이터베이스에 암호화폐 Ticker가 없습니다.' },
         { status: 500 }
       );
     }

    const apiKey = process.env.COINMARKETCAP_API_KEY;
    const cryptosData = [];

    try {
      console.log('📡 CoinMarketCap API 호출 시작...');
      
             // CoinMarketCap API v2만 사용 (v3는 불필요)
       console.log('📡 CoinMarketCap API v2 호출 시작...');
      
             // 데이터베이스의 각 Ticker에 대해 API 데이터 매칭
       for (const ticker of cryptoTickers) {
         try {
           // symbol로 검색 (더 안정적)
           const symbolResponse = await fetch(
             `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${ticker.symbol}`,
             {
               headers: {
                 'X-CMC_PRO_API_KEY': apiKey,
               },
             }
           );
           
                      if (symbolResponse.ok) {
              const symbolData = await symbolResponse.json();
              console.log(`📊 ${ticker.symbol} API 응답:`, symbolData);
              
              if (symbolData.data && symbolData.data[ticker.symbol]) {
                const crypto = symbolData.data[ticker.symbol][0]; // 첫 번째 결과 사용
                const quote = crypto.quote.USD;
                
                // API 응답 데이터 상세 로깅
                console.log(`✅ ${ticker.symbol} 데이터 파싱 성공:`, {
                  price: quote.price,
                  percentChange24h: quote.percent_change_24h,
                  volumeChange24h: quote.volume_change_24h
                });
                
                // 등락금액 계산: 현재가격 * (등락율 / 100)
                const currentPrice = quote.price;
                const percentChange = quote.percent_change_24h;
                const priceChange = currentPrice * (percentChange / 100);
                
                cryptosData.push({
                  id: crypto.id,
                  symbol: crypto.symbol,
                  name: ticker.name || crypto.name, // DB에 있는 이름 우선 사용
                  price: currentPrice.toFixed(2),
                  change: percentChange > 0 ? `+${priceChange.toFixed(2)}` : `${priceChange.toFixed(2)}`,
                  changePercent: percentChange > 0 ? `+${percentChange.toFixed(2)}%` : `${percentChange.toFixed(2)}%`
                });
              } else {
                console.log(`⚠️ ${ticker.symbol} API 데이터 없음:`, symbolData);
                // API 데이터가 없어도 DB에 있는 정보로 오류 표시
                cryptosData.push({
                  id: ticker.id || 0,
                  symbol: ticker.symbol,
                  name: ticker.name || ticker.symbol,
                  price: '조회 오류',
                  change: '조회 오류',
                  changePercent: '조회 오류'
                });
              }
            } else {
              console.log(`⚠️ ${ticker.symbol} API 호출 실패:`, symbolResponse.status, symbolResponse.statusText);
              const errorText = await symbolResponse.text();
              console.log(`⚠️ ${ticker.symbol} 에러 응답:`, errorText);
              // API 호출 실패 시에도 DB에 있는 정보로 오류 표시
              cryptosData.push({
                id: ticker.id || 0,
                symbol: ticker.symbol,
                name: ticker.name || ticker.symbol,
                price: '조회 오류',
                change: '조회 오류',
                changePercent: '조회 오류'
              });
            }
         } catch (tickerError) {
           console.error(`💥 ${ticker.symbol} 개별 처리 실패:`, tickerError);
           // 예외 발생 시에도 DB에 있는 정보로 오류 표시
           cryptosData.push({
             id: ticker.id || 0,
             symbol: ticker.symbol,
             name: ticker.name || ticker.symbol,
             price: '조회 오류',
             change: '조회 오류',
             changePercent: '조회 오류'
           });
         }
       }
      
      console.log(`📊 총 ${cryptosData.length}개 암호화폐 데이터 수집 완료`);
      
         } catch (apiError) {
       console.error('💥 CoinMarketCap API 호출 실패:', apiError);
       
       // API 실패시 오류 반환 (더미 데이터 없음)
       return NextResponse.json(
         { error: 'CoinMarketCap API 호출에 실패했습니다.' },
         { status: 500 }
       );
     }

         // 시장 지표 데이터 (API에서 가져올 수 없으므로 기본값)
                // 공포탐욕지수 API 호출
           let fearGreedIndex = 'N/A';
           try {
             const fearGreedResponse = await fetch('https://api.alternative.me/fng/');
             if (fearGreedResponse.ok) {
               const fearGreedData = await fearGreedResponse.json();
               if (fearGreedData.data && fearGreedData.data[0]) {
                 fearGreedIndex = fearGreedData.data[0].value;
                 console.log('✅ 공포탐욕지수 조회 성공:', fearGreedIndex);
               }
             }
           } catch (error) {
             console.log('⚠️ 공포탐욕지수 조회 실패:', error);
           }

           // 비트코인 도미넌스 API 호출
           let btcDominance = 'N/A';
           try {
             const btcResponse = await fetch(
               `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=BTC`,
               {
                 headers: {
                   'X-CMC_PRO_API_KEY': apiKey,
                 },
               }
             );
             if (btcResponse.ok) {
               const btcData = await btcResponse.json();
               if (btcData.data && btcData.data.BTC && btcData.data.BTC[0]) {
                 const btcQuote = btcData.data.BTC[0].quote.USD;
                 btcDominance = btcQuote.market_cap_dominance?.toFixed(2) || 'N/A';
                 console.log('✅ 비트코인 도미넌스 조회 성공:', btcDominance);
               }
             }
           } catch (error) {
             console.log('⚠️ 비트코인 도미넌스 조회 실패:', error);
           }

           // 이더리움 도미넌스 API 호출
           let ethDominance = 'N/A';
           try {
             const ethResponse = await fetch(
               `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=ETH`,
               {
                 headers: {
                   'X-CMC_PRO_API_KEY': apiKey,
                 },
               }
             );
             if (ethResponse.ok) {
               const ethData = await ethResponse.json();
               if (ethData.data && ethData.data.ETH && ethData.data.ETH[0]) {
                 const ethQuote = ethData.data.ETH[0].quote.USD;
                 ethDominance = ethQuote.market_cap_dominance?.toFixed(2) || 'N/A';
                 console.log('✅ 이더리움 도미넌스 조회 성공:', ethDominance);
               }
             }
           } catch (error) {
             console.log('⚠️ 이더리움 도미넌스 조회 실패:', error);
           }

           const marketIndicators = {
             fearGreedIndex,
             btcDominance,
             ethDominance
           };

         const result = {
       cryptos: cryptosData,
       indicators: marketIndicators,
       timestamp: new Date().toISOString()
     };
     
     console.log('📊 최종 결과:', result);
     console.log('📊 반환할 데이터 구조:', {
       cryptosCount: cryptosData.length,
       cryptosData: cryptosData,
       indicators: marketIndicators
     });
     
     return NextResponse.json(result);

  } catch (error) {
    console.error('💥 암호화폐 데이터 조회 전체 실패:', error);
    return NextResponse.json(
      { error: '암호화폐 데이터 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
