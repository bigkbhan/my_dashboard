import { NextRequest, NextResponse } from 'next/server';
import { getCryptoTickers, addCryptoTicker, updateCryptoTicker, deleteCryptoTicker } from '@/lib/db';

// 암호화폐 Ticker 목록 조회
export async function GET() {
  try {
    const tickers = await getCryptoTickers();
    return NextResponse.json({ tickers });
  } catch (error) {
    console.error('암호화폐 Ticker 조회 실패:', error);
    return NextResponse.json(
      { error: '암호화폐 Ticker 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 암호화폐 Ticker 추가
export async function POST(request: NextRequest) {
  try {
    const { symbol, name, coin_id } = await request.json();
    
    if (!symbol || !name) {
      return NextResponse.json(
        { error: 'symbol과 name은 필수입니다.' },
        { status: 400 }
      );
    }
    
    const success = await addCryptoTicker(symbol, name, coin_id);
    
    if (success) {
      return NextResponse.json({ message: '암호화폐 Ticker가 추가되었습니다.' });
    } else {
      return NextResponse.json(
        { error: '암호화폐 Ticker 추가에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('암호화폐 Ticker 추가 실패:', error);
    return NextResponse.json(
      { error: '암호화폐 Ticker 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 암호화폐 Ticker 수정
export async function PUT(request: NextRequest) {
  try {
    const { id, symbol, name, coin_id } = await request.json();
    
    if (!id || !symbol || !name) {
      return NextResponse.json(
        { error: 'id, symbol, name은 필수입니다.' },
        { status: 400 }
      );
    }
    
    const success = await updateCryptoTicker(id, symbol, name, coin_id);
    
    if (success) {
      return NextResponse.json({ message: '암호화폐 Ticker가 수정되었습니다.' });
    } else {
      return NextResponse.json(
        { error: '암호화폐 Ticker 수정에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('암호화폐 Ticker 수정 실패:', error);
    return NextResponse.json(
      { error: '암호화폐 Ticker 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 암호화폐 Ticker 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'id는 필수입니다.' },
        { status: 400 }
      );
    }
    
    const success = await deleteCryptoTicker(id);
    
    if (success) {
      return NextResponse.json({ message: '암호화폐 Ticker가 삭제되었습니다.' });
    } else {
      return NextResponse.json(
        { error: '암호화폐 Ticker 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('암호화폐 Ticker 삭제 실패:', error);
    return NextResponse.json(
      { error: '암호화폐 Ticker 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}


