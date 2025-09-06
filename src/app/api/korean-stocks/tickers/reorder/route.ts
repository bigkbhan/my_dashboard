import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { tickerIds } = await request.json();
    
    if (!tickerIds || !Array.isArray(tickerIds)) {
      return NextResponse.json(
        { error: '티커 ID 배열이 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 순서대로 display_order 업데이트
    for (let i = 0; i < tickerIds.length; i++) {
      await sql`
        UPDATE korean_stock_tickers 
        SET display_order = ${i + 1}
        WHERE id = ${tickerIds[i]}
      `;
    }
    
    return NextResponse.json({ message: '한국주식 티커 순서가 변경되었습니다.' });
  } catch (error) {
    console.error('한국주식 티커 순서 변경 실패:', error);
    return NextResponse.json(
      { error: '한국주식 티커 순서 변경에 실패했습니다.' },
      { status: 500 }
    );
  }
}
