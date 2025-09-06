import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// 환율 데이터 초기화 API
export async function POST(request: NextRequest) {
  try {
    console.log('환율 데이터 초기화 시작');
    
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: '환율 API 키가 설정되지 않았습니다.',
          details: 'EXCHANGE_RATE_API_KEY 환경변수를 확인해주세요.'
        },
        { status: 500 }
      );
    }

    // 기존 데이터 삭제
    await sql`DELETE FROM exchange_rates`;
    console.log('기존 환율 데이터 삭제 완료');

    // 최근 7일간의 환율 데이터 수집 (실제로는 현재 데이터만 가능)
    const today = new Date();
    
    // 현재 환율 데이터 수집
    const usdResponse = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
    if (!usdResponse.ok) {
      throw new Error(`USD 환율 API 오류: ${usdResponse.status}`);
    }
    const usdData = await usdResponse.json();
    
    const jpyResponse = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/JPY`);
    if (!jpyResponse.ok) {
      throw new Error(`JPY 환율 API 오류: ${jpyResponse.status}`);
    }
    const jpyData = await jpyResponse.json();

    // 현재 환율 데이터 저장
    const usdRate = usdData.conversion_rates.KRW || 0;
    const jpyRate = (jpyData.conversion_rates.KRW || 0) * 100;
    const todayStr = today.toISOString().split('T')[0];

    await sql`
      INSERT INTO exchange_rates (currency, rate, date)
      VALUES 
        (${'USD/KRW'}, ${usdRate}, ${todayStr}),
        (${'100JPY/KRW'}, ${jpyRate}, ${todayStr})
    `;

    // 과거 데이터 시뮬레이션 (실제 환경에서는 과거 데이터를 별도로 수집해야 함)
    // 여기서는 현재 데이터를 기준으로 약간의 변동을 주어 과거 데이터를 생성
    const pastDays = 6; // 오늘을 제외한 6일
    const currencies = ['USD/KRW', '100JPY/KRW'];
    const baseRates = [usdRate, jpyRate];

    for (let i = 1; i <= pastDays; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      const pastDateStr = pastDate.toISOString().split('T')[0];

      for (let j = 0; j < currencies.length; j++) {
        // ±2% 범위 내에서 랜덤 변동 생성
        const variation = (Math.random() - 0.5) * 0.04; // ±2%
        const simulatedRate = baseRates[j] * (1 + variation);
        
        await sql`
          INSERT INTO exchange_rates (currency, rate, date)
          VALUES (${currencies[j]}, ${simulatedRate}, ${pastDateStr})
        `;
      }
    }

    console.log('환율 데이터 초기화 완료');

    return NextResponse.json({
      message: '환율 데이터 초기화가 완료되었습니다.',
      details: `${pastDays + 1}일간의 환율 데이터가 생성되었습니다.`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('환율 데이터 초기화 실패:', error);
    
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    
    return NextResponse.json(
      { 
        error: '환율 데이터 초기화에 실패했습니다.',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
