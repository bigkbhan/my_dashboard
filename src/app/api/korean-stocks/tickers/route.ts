import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// 한국주식 티커 목록 조회
export async function GET() {
  try {
    const result = await sql`
      SELECT id, ticker_code, ticker_name, display_order, is_active, created_at
      FROM korean_stock_tickers 
      ORDER BY display_order ASC
    `;
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('한국주식 티커 조회 실패:', error);
    return NextResponse.json(
      { error: '한국주식 티커를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 한국주식 티커 추가
export async function POST(request: NextRequest) {
  try {
    const { ticker_code, ticker_name } = await request.json();
    
    if (!ticker_code || !ticker_name) {
      return NextResponse.json(
        { error: '티커 코드와 종목명은 필수입니다.' },
        { status: 400 }
      );
    }
    
    // 최대 display_order 조회
    const maxOrderResult = await sql`
      SELECT COALESCE(MAX(display_order), 0) as max_order
      FROM korean_stock_tickers
    `;
    const maxOrder = maxOrderResult.rows[0]?.max_order || 0;
    
    // 새 티커 추가
    await sql`
      INSERT INTO korean_stock_tickers (ticker_code, ticker_name, display_order, is_active, created_at)
      VALUES (${ticker_code}, ${ticker_name}, ${maxOrder + 1}, true, NOW())
    `;
    
    return NextResponse.json({ message: '한국주식 티커가 추가되었습니다.' });
  } catch (error) {
    console.error('한국주식 티커 추가 실패:', error);
    return NextResponse.json(
      { error: '한국주식 티커 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 한국주식 티커 수정
export async function PUT(request: NextRequest) {
  try {
    const { id, ticker_code, ticker_name, is_active } = await request.json();
    
    if (!id || !ticker_code || !ticker_name) {
      return NextResponse.json(
        { error: 'ID, 티커 코드, 종목명은 필수입니다.' },
        { status: 400 }
      );
    }
    
    await sql`
      UPDATE korean_stock_tickers 
      SET ticker_code = ${ticker_code}, 
          ticker_name = ${ticker_name}, 
          is_active = ${is_active}
      WHERE id = ${id}
    `;
    
    return NextResponse.json({ message: '한국주식 티커가 수정되었습니다.' });
  } catch (error) {
    console.error('한국주식 티커 수정 실패:', error);
    return NextResponse.json(
      { error: '한국주식 티커 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 한국주식 티커 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: '삭제할 티커 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    await sql`
      DELETE FROM korean_stock_tickers 
      WHERE id = ${id}
    `;
    
    return NextResponse.json({ message: '한국주식 티커가 삭제되었습니다.' });
  } catch (error) {
    console.error('한국주식 티커 삭제 실패:', error);
    return NextResponse.json(
      { error: '한국주식 티커 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
