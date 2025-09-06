import { NextResponse } from 'next/server';
import { getStockTickers } from '@/lib/db';
import { getEnvVars } from '@/lib/env';

// 이전 날짜 데이터를 가져와서 등락폭 계산하는 함수
async function getPreviousDayData(symbol: string): Promise<{ previousClose: number | null, previousDate: string | null }> {
  try {
    // 5일 전까지의 데이터를 가져와서 가장 최근의 유효한 이전 종가를 찾음
    const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
    console.log(`🔍 ${symbol} 이전 날짜 데이터 조회: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      console.log(`⚠️ ${symbol} 이전 날짜 데이터 조회 실패: ${response.status}`);
      return { previousClose: null, previousDate: null };
    }
    
    const data = await response.json();
    
    if (data.chart?.result?.[0]?.indicators?.quote?.[0]?.close) {
      const closes = data.chart.result[0].indicators.quote[0].close;
      const timestamps = data.chart.result[0].timestamp;
      
      // 가장 최근의 유효한 이전 종가를 찾음 (마지막에서 두 번째 값)
      for (let i = closes.length - 2; i >= 0; i--) {
        if (closes[i] && closes[i] > 0) {
          const previousDate = new Date(timestamps[i] * 1000).toLocaleDateString('ko-KR');
          console.log(`✅ ${symbol} 이전 종가 발견: ${closes[i]} (${previousDate})`);
          return { previousClose: closes[i], previousDate };
        }
      }
    }
    
    console.log(`⚠️ ${symbol} 유효한 이전 종가를 찾을 수 없음`);
    return { previousClose: null, previousDate: null };
    
  } catch (error) {
    console.error(`💥 ${symbol} 이전 날짜 데이터 조회 실패:`, error);
    return { previousClose: null, previousDate: null };
  }
}

export async function GET() {
  try {
    console.log('🚀 주식 정보 조회 시작');
    console.log('📅 현재 시간:', new Date().toISOString());
    
    // 환경변수 로딩 및 검증
    try {
      const envVars = getEnvVars();
      console.log('✅ 환경변수 로딩 성공:', {
        POSTGRES_URL: envVars.POSTGRES_URL ? '설정됨' : '설정되지 않음',
        COINMARKETCAP_API_KEY: envVars.COINMARKETCAP_API_KEY ? '설정됨' : '설정되지 않음',
        ALPHA_VANTAGE_API_KEY: envVars.ALPHA_VANTAGE_API_KEY ? '설정됨' : '설정되지 않음',
        BOK_API_KEY: envVars.BOK_API_KEY ? '설정됨' : '설정되지 않음'
      });
    } catch (envError) {
      console.error('💥 환경변수 로딩 실패:', envError);
    }
    
    console.log('🌍 환경변수 확인:', {
      NODE_ENV: process.env.NODE_ENV
    });

    // 주요지수 데이터 가져오기 (Yahoo Finance)
    const indices = [
      { symbol: '^DJI', name: '다우존스' },
      { symbol: '^GSPC', name: 'S&P 500' },
      { symbol: '^IXIC', name: 'NASDAQ' }
    ];
    const indicesData = [];

    console.log('📊 주요지수 조회 시작:', indices.map(i => `${i.symbol} (${i.name})`));

    for (const index of indices) {
      try {
        console.log(`🔍 ${index.symbol} (${index.name}) Yahoo Finance API 시도...`);
        
        // Yahoo Finance API URL (더 간단한 엔드포인트 시도)
        const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${index.symbol}?interval=1d&range=1d`;
        console.log(`🌐 Yahoo Finance API URL: ${apiUrl}`);
        
        // 더 강력한 헤더 설정
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
            'Origin': 'https://finance.yahoo.com',
            'Referer': 'https://finance.yahoo.com/',
            'DNT': '1',
            'Upgrade-Insecure-Requests': '1'
          },
          // 타임아웃 설정
          signal: AbortSignal.timeout(10000) // 10초 타임아웃
        });
        
        console.log(`📡 ${index.symbol} Yahoo Finance API 응답 상태:`, response.status, response.statusText);
        console.log(`📡 ${index.symbol} 응답 헤더:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ ${index.symbol} Yahoo Finance HTTP 오류:`, {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText.substring(0, 500)
          });
          throw new Error(`Yahoo Finance HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`📊 ${index.symbol} Yahoo Finance API 응답 데이터 구조:`, {
          hasChart: !!data.chart,
          hasResult: !!(data.chart && data.chart.result),
          resultLength: data.chart?.result?.length || 0,
          hasMeta: !!(data.chart?.result?.[0]?.meta),
          hasTimestamp: !!(data.chart?.result?.[0]?.timestamp),
          hasQuotes: !!(data.chart?.result?.[0]?.indicators?.quote?.[0])
        });
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
          const result = data.chart.result[0];
          const meta = result.meta;
          const timestamps = result.timestamp;
          const quotes = result.indicators.quote[0];
          
          console.log(`📋 ${index.symbol} 메타데이터:`, {
            regularMarketPrice: meta?.regularMarketPrice,
            previousClose: meta?.previousClose,
            regularMarketTime: meta?.regularMarketTime,
            timezone: meta?.timezone
          });
          
          if (meta && timestamps && quotes && timestamps.length >= 1) {
            const currentPrice = meta.regularMarketPrice || 0;
            const previousClose = meta.previousClose;
            
            if (currentPrice > 0) {
              let change, changePercent;
              let previousCloseFinal = previousClose;
              let previousDate = null;
              
              if (previousClose && previousClose > 0) {
                change = (currentPrice - previousClose).toFixed(2);
                changePercent = ((currentPrice - previousClose) / previousClose * 100).toFixed(2);
                console.log(`✅ ${index.symbol} 메타데이터에서 이전 종가 사용: ${previousClose}`);
              } else {
                console.log(`⚠️ ${index.symbol} 메타데이터에 이전 종가 없음, 이전 날짜 데이터 조회 시도...`);
                
                // 이전 날짜 데이터에서 종가 가져오기
                const previousData = await getPreviousDayData(index.symbol);
                if (previousData.previousClose && previousData.previousClose > 0) {
                  previousCloseFinal = previousData.previousClose;
                  previousDate = previousData.previousDate;
                  change = (currentPrice - previousCloseFinal).toFixed(2);
                  changePercent = ((currentPrice - previousCloseFinal) / previousCloseFinal * 100).toFixed(2);
                  console.log(`✅ ${index.symbol} 이전 날짜 데이터에서 종가 발견: ${previousCloseFinal} (${previousDate})`);
                } else {
                  change = 'N/A';
                  changePercent = 'N/A';
                  console.log(`⚠️ ${index.symbol} 이전 종가를 찾을 수 없어 등락폭 계산 불가`);
                }
              }
              
              console.log(`✅ ${index.symbol} Yahoo Finance 데이터 성공:`, {
                currentPrice,
                previousClose: previousCloseFinal,
                previousDate,
                change,
                changePercent
              });
              
              indicesData.push({
                symbol: index.symbol.replace('^', ''),
                name: index.name,
                price: currentPrice.toFixed(2),
                change: change === 'N/A' ? change : (parseFloat(change) > 0 ? `+${change}` : change),
                changePercent: changePercent === 'N/A' ? changePercent : (parseFloat(changePercent) > 0 ? `+${changePercent}%` : `${changePercent}%`)
              });
              
              console.log(`✅ ${index.symbol} Yahoo Finance 데이터 추가 완료:`, indicesData[indicesData.length - 1]);
            } else {
              console.log(`⚠️ ${index.symbol} 현재 가격이 유효하지 않음:`, currentPrice);
            }
          } else {
            console.log(`❌ ${index.symbol} Yahoo Finance 필요한 데이터 필드 없음`);
          }
        } else {
          console.log(`❌ ${index.symbol} Yahoo Finance chart.result 데이터 없음`);
          throw new Error('chart.result 데이터 없음');
        }
      } catch (error) {
        console.error(`💥 ${index.symbol} Yahoo Finance API 실패:`, error);
        
        // Yahoo Finance 실패 시 다른 방법 시도
        try {
          console.log(`🔄 ${index.symbol} 대안 방법 시도...`);
          
          // 간단한 테스트 데이터 (실제 운영에서는 제거)
          console.log(`⚠️ ${index.symbol} 테스트 데이터 사용 (실제 운영에서는 제거 필요)`);
          
          // 여기에 다른 API 호출 로직을 추가할 수 있습니다
          // 예: Finnhub, Polygon.io, IEX Cloud 등
          
        } catch (alternativeError) {
          console.error(`💥 ${index.symbol} 대안 방법도 실패:`, alternativeError);
        }
      }
    }

    console.log(`📊 주요지수 조회 완료: ${indicesData.length}/${indices.length}개 성공`);

    // 데이터베이스에서 주식 Ticker 목록 가져오기
    let stockTickers = [];
    try {
      console.log('🗄️ 데이터베이스 연결 시도...');
      stockTickers = await getStockTickers();
      console.log('✅ 데이터베이스에서 가져온 주식 Tickers:', stockTickers);
    } catch (dbError) {
      console.error('💥 데이터베이스 연결 실패:', dbError);
      // 데이터베이스 연결 실패 시 기본 주식 목록 사용
      stockTickers = [
        { symbol: 'AAPL', company_name: 'Apple Inc.' },
        { symbol: 'MSFT', company_name: 'Microsoft Corporation' },
        { symbol: 'GOOGL', company_name: 'Alphabet Inc.' },
        { symbol: 'AMZN', company_name: 'Amazon.com Inc.' },
        { symbol: 'TSLA', company_name: 'Tesla Inc.' }
      ];
      console.log('⚠️ 기본 주식 목록 사용:', stockTickers);
    }
    
    const stocks = stockTickers.map(ticker => ticker.symbol);
    const stocksData = [];

    // 데이터베이스에 Ticker가 있으면 API로 데이터 조회
    if (stocks.length > 0) {
      console.log(`📈 주식 Ticker 조회 시작: ${stocks.length}개`);
      console.log(`📋 주식 Ticker 목록:`, stocks);
      
      for (const symbol of stocks) {
        try {
          console.log(`🔍 ${symbol} 주식 데이터 조회 시작...`);
          
          const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
          console.log(`🌐 ${symbol} Yahoo Finance API URL: ${apiUrl}`);
          
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'cross-site',
              'Origin': 'https://finance.yahoo.com',
              'Referer': 'https://finance.yahoo.com/',
              'DNT': '1',
              'Upgrade-Insecure-Requests': '1'
            },
            signal: AbortSignal.timeout(10000)
          });
          
          console.log(`📡 ${symbol} Yahoo Finance API 응답 상태:`, response.status, response.statusText);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ ${symbol} Yahoo Finance HTTP 오류:`, {
              status: response.status,
              statusText: response.statusText,
              errorText: errorText.substring(0, 500)
            });
            throw new Error(`Yahoo Finance HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log(`📊 ${symbol} Yahoo Finance API 응답 데이터 구조:`, {
            hasChart: !!data.chart,
            hasResult: !!(data.chart && data.chart.result),
            resultLength: data.chart?.result?.length || 0,
            hasMeta: !!(data.chart?.result?.[0]?.meta),
            hasTimestamp: !!(data.chart?.result?.[0]?.timestamp),
            hasQuotes: !!(data.chart?.result?.[0]?.indicators?.quote?.[0])
          });
          
          if (data.chart && data.chart.result && data.chart.result[0]) {
            const result = data.chart.result[0];
            const meta = result.meta;
            const timestamps = result.timestamp;
            const quotes = result.indicators.quote[0];
            
            if (meta && timestamps && quotes && timestamps.length >= 1) {
              const currentPrice = meta.regularMarketPrice || 0;
              const previousClose = meta.previousClose;
              
              if (currentPrice > 0) {
                let change, changePercent;
                let previousCloseFinal = previousClose;
                let previousDate = null;
                
                if (previousClose && previousClose > 0) {
                  change = (currentPrice - previousClose).toFixed(2);
                  changePercent = ((currentPrice - previousClose) / previousClose * 100).toFixed(2);
                  console.log(`✅ ${symbol} 메타데이터에서 이전 종가 사용: ${previousClose}`);
                } else {
                  console.log(`⚠️ ${symbol} 메타데이터에 이전 종가 없음, 이전 날짜 데이터 조회 시도...`);
                  
                  // 이전 날짜 데이터에서 종가 가져오기
                  const previousData = await getPreviousDayData(symbol);
                  if (previousData.previousClose && previousData.previousClose > 0) {
                    previousCloseFinal = previousData.previousClose;
                    previousDate = previousData.previousDate;
                    change = (currentPrice - previousCloseFinal).toFixed(2);
                    changePercent = ((currentPrice - previousCloseFinal) / previousCloseFinal * 100).toFixed(2);
                    console.log(`✅ ${symbol} 이전 날짜 데이터에서 종가 발견: ${previousCloseFinal} (${previousDate})`);
                  } else {
                    change = 'N/A';
                    changePercent = 'N/A';
                    console.log(`⚠️ ${symbol} 이전 종가를 찾을 수 없어 등락폭 계산 불가`);
                  }
                }
              
                console.log(`✅ ${symbol} Yahoo Finance 데이터 성공:`, {
                  currentPrice,
                  previousClose: previousCloseFinal,
                  previousDate,
                  change,
                  changePercent
                });
                
                // 데이터베이스에서 company_name 가져오기
                const tickerInfo = stockTickers.find(t => t.symbol === symbol);
                
                const stockData = {
                  symbol,
                  companyName: tickerInfo?.company_name || symbol,
                  price: currentPrice.toFixed(2),
                  change: change === 'N/A' ? change : (parseFloat(change) > 0 ? `+${change}` : change),
                  changePercent: changePercent === 'N/A' ? changePercent : (parseFloat(changePercent) > 0 ? `+${changePercent}%` : `${changePercent}%`)
                };
                
                stocksData.push(stockData);
                console.log(`✅ ${symbol} Yahoo Finance 데이터 추가 완료:`, stockData);
              } else {
                console.log(`⚠️ ${symbol} 현재 가격이 유효하지 않음:`, currentPrice);
              }
            } else {
              console.log(`❌ ${symbol} Yahoo Finance 필요한 데이터 필드 없음`);
            }
          } else {
            console.log(`❌ ${symbol} Yahoo Finance chart.result 데이터 없음`);
          }
        } catch (error) {
          console.error(`💥 ${symbol} Yahoo Finance API 실패:`, error);
        }
      }
      
      console.log(`📈 주식 데이터 조회 완료: ${stocksData.length}/${stocks.length}개 성공`);
    } else {
      console.log(`⚠️ 데이터베이스에 주식 Ticker가 없습니다.`);
    }

    const result = {
      indices: indicesData,
      stocks: stocksData,
      timestamp: new Date().toISOString(),
      debug: {
        yahooFinanceSuccess: indicesData.length > 0 || stocksData.length > 0,
        indicesCount: indicesData.length,
        stocksCount: stocksData.length,
        apiSource: 'Yahoo Finance'
      }
    };
    
    console.log('📊 최종 결과 요약:');
    console.log(`   - 주요지수: ${indicesData.length}개`);
    console.log(`   - 주식: ${stocksData.length}개`);
    console.log(`   - 디버그 정보:`, result.debug);
    console.log(`   - 전체 데이터:`, JSON.stringify(result, null, 2));
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('💥 주식 데이터 조회 실패:', error);
    if (error instanceof Error) {
      console.error('💥 에러 상세:', {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 10)
      });
    }
    return NextResponse.json(
      { 
        error: '주식 데이터 조회에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
