import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { symbol, name, is_active } = await request.json();

    if (!symbol || !name) {
      return NextResponse.json(
        { error: '심볼과 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    // 중복 체크
    const existingTicker = await sql`
      SELECT id FROM crypto_tickers 
      WHERE symbol = ${symbol} AND is_active = true
    `;

    if (existingTicker.rows.length > 0) {
      return NextResponse.json(
        { error: '이미 존재하는 심볼입니다.' },
        { status: 409 }
      );
    }

    // 새 ticker 추가 (display_order는 현재 최대값 + 1)
    const maxOrderResult = await sql`
      SELECT COALESCE(MAX(display_order), 0) as max_order FROM crypto_tickers WHERE is_active = true
    `;
    const newDisplayOrder = (maxOrderResult.rows[0]?.max_order || 0) + 1;

    const result = await sql`
      INSERT INTO crypto_tickers (symbol, name, is_active, display_order)
      VALUES (${symbol}, ${name}, ${is_active}, ${newDisplayOrder})
      RETURNING id, symbol, name, is_active, display_order, created_at
    `;

    return NextResponse.json({
      message: '암호화폐 ticker가 성공적으로 추가되었습니다.',
      ticker: result.rows[0]
    });

  } catch (error) {
    console.error('암호화폐 ticker 추가 오류:', error);
    return NextResponse.json(
      { error: '암호화폐 ticker 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
