import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const { company_name, sector, is_active } = await request.json();

    if (!company_name) {
      return NextResponse.json(
        { error: '회사명은 필수입니다.' },
        { status: 400 }
      );
    }

    // ticker 수정
    const result = await sql`
      UPDATE stock_tickers 
      SET company_name = ${company_name}, sector = ${sector || ''}, is_active = ${is_active}, updated_at = NOW()
      WHERE symbol = ${symbol}
      RETURNING id, symbol, company_name, sector, is_active, updated_at
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '해당 심볼을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: '주식 ticker가 성공적으로 수정되었습니다.',
      ticker: result.rows[0]
    });

  } catch (error) {
    console.error('주식 ticker 수정 오류:', error);
    return NextResponse.json(
      { error: '주식 ticker 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;

    if (!symbol) {
      return NextResponse.json(
        { error: '심볼이 필요합니다.' },
        { status: 400 }
      );
    }

    // ticker 완전 삭제
    const result = await sql`
      DELETE FROM stock_tickers 
      WHERE symbol = ${symbol}
      RETURNING id, symbol, company_name
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '해당 심볼을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: '주식 ticker가 성공적으로 삭제되었습니다.',
      ticker: result.rows[0]
    });

  } catch (error) {
    console.error('주식 ticker 삭제 오류:', error);
    return NextResponse.json(
      { error: '주식 ticker 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
