import { NextRequest, NextResponse } from 'next/server';
import { getStockTickers, getCryptoTickers } from '@/lib/db';

export async function GET() {
  try {
    // 주식 Ticker 조회 테스트
    const stockTickers = await getStockTickers();
    console.log('주식 Ticker 조회 결과:', stockTickers);
    
    // 암호화폐 Ticker 조회 테스트
    const cryptoTickers = await getCryptoTickers();
    console.log('암호화폐 Ticker 조회 결과:', cryptoTickers);
    
    return NextResponse.json({
      success: true,
      message: '데이터베이스 연결 성공',
      stockTickers: {
        count: stockTickers.length,
        data: stockTickers
      },
      cryptoTickers: {
        count: cryptoTickers.length,
        data: cryptoTickers
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('데이터베이스 연결 테스트 실패:', error);
    
    return NextResponse.json({
      success: false,
      message: '데이터베이스 연결 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}


