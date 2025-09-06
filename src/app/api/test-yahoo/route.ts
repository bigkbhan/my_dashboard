import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Yahoo Finance API 테스트 시작');
    
    // 간단한 테스트: AAPL 주식 데이터 조회
    const testSymbol = 'AAPL';
    const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${testSymbol}?interval=1d&range=2d`;
    
    console.log('🌐 테스트 API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('📡 응답 상태:', response.status, response.statusText);
    console.log('📡 응답 헤더:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP 오류:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500)
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 API 응답 데이터 구조:', {
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
      
      console.log('📋 메타데이터:', {
        regularMarketPrice: meta?.regularMarketPrice,
        previousClose: meta?.previousClose,
        regularMarketTime: meta?.regularMarketTime,
        timezone: meta?.timezone
      });
      
      if (meta && timestamps && quotes && timestamps.length >= 2) {
        const currentPrice = meta.regularMarketPrice || 0;
        const previousClose = meta.previousClose || 0;
        
        if (previousClose > 0) {
          const change = (currentPrice - previousClose).toFixed(2);
          const changePercent = ((currentPrice - previousClose) / previousClose * 100).toFixed(2);
          
          const testResult = {
            symbol: testSymbol,
            currentPrice,
            previousClose,
            change,
            changePercent: `${changePercent}%`,
            timestamp: new Date().toISOString(),
            success: true
          };
          
          console.log('✅ 테스트 성공:', testResult);
          return NextResponse.json(testResult);
        } else {
          console.log('⚠️ 이전 종가가 유효하지 않음:', previousClose);
          return NextResponse.json({
            error: '이전 종가가 유효하지 않습니다.',
            previousClose,
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
      } else {
        console.log('❌ 필요한 데이터 필드 없음');
        return NextResponse.json({
          error: '필요한 데이터 필드가 없습니다.',
          hasMeta: !!meta,
          hasTimestamp: !!timestamps,
          hasQuotes: !!quotes,
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    } else {
      console.log('❌ chart.result 데이터 없음');
      return NextResponse.json({
        error: 'chart.result 데이터가 없습니다.',
        data: data,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('💥 테스트 실패:', error);
    return NextResponse.json(
      { 
        error: 'Yahoo Finance API 테스트에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}


