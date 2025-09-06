import { NextRequest, NextResponse } from 'next/server';
import { getStockTickers, addStockTicker, updateStockTicker, deleteStockTicker } from '@/lib/db';

// 주식 Ticker 목록 조회
export async function GET() {
  try {
    const tickers = await getStockTickers();
    return NextResponse.json({ tickers });
  } catch (error) {
    console.error('주식 Ticker 조회 실패:', error);
    return NextResponse.json(
      { error: '주식 Ticker 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 주식 Ticker 추가
export async function POST(request: NextRequest) {
  try {
    const { symbol, company_name, sector } = await request.json();
    
    if (!symbol || !company_name) {
      return NextResponse.json(
        { error: 'symbol과 company_name은 필수입니다.' },
        { status: 400 }
      );
    }
    
    const success = await addStockTicker(symbol, company_name, sector);
    
    if (success) {
      return NextResponse.json({ message: '주식 Ticker가 추가되었습니다.' });
    } else {
      return NextResponse.json(
        { error: '주식 Ticker 추가에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('주식 Ticker 추가 실패:', error);
    return NextResponse.json(
      { error: '주식 Ticker 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 주식 Ticker 수정
export async function PUT(request: NextRequest) {
  try {
    const { id, symbol, company_name, sector } = await request.json();
    
    if (!id || !symbol || !company_name) {
      return NextResponse.json(
        { error: 'id, symbol, company_name은 필수입니다.' },
        { status: 400 }
      );
    }
    
    const success = await updateStockTicker(id, symbol, company_name, sector);
    
    if (success) {
      return NextResponse.json({ message: '주식 Ticker가 수정되었습니다.' });
    } else {
      return NextResponse.json(
        { error: '주식 Ticker 수정에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('주식 Ticker 수정 실패:', error);
    return NextResponse.json(
      { error: '주식 Ticker 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 주식 Ticker 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'id는 필수입니다.' },
        { status: 400 }
      );
    }
    
    const success = await deleteStockTicker(id);
    
    if (success) {
      return NextResponse.json({ message: '주식 Ticker가 삭제되었습니다.' });
    } else {
      return NextResponse.json(
        { error: '주식 Ticker 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('주식 Ticker 삭제 실패:', error);
    return NextResponse.json(
      { error: '주식 Ticker 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}


