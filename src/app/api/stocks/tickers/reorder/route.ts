import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function PUT(request: NextRequest) {
  try {
    const { tickers } = await request.json();

    if (!Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json(
        { error: '유효한 ticker 목록이 필요합니다.' },
        { status: 400 }
      );
    }

    // 트랜잭션으로 순서 업데이트
    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];
      await sql`
        UPDATE stock_tickers 
        SET display_order = ${i + 1}, updated_at = NOW()
        WHERE symbol = ${ticker.symbol} AND is_active = true
      `;
    }

    return NextResponse.json({
      message: '주식 ticker 순서가 성공적으로 업데이트되었습니다.',
      updatedCount: tickers.length
    });

  } catch (error) {
    console.error('주식 ticker 순서 변경 오류:', error);
    return NextResponse.json(
      { error: '주식 ticker 순서 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


