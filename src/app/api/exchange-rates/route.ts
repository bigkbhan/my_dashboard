import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

interface ExchangeRateData {
  currency: string;
  rate: string;
  change: string;
  changePercent: string;
  lastUpdate: string;
}

interface HistoricalRate {
  currency: string;
  rate: number;
  date: string;
}

// 과거 환율 데이터 조회 함수
async function getHistoricalRates(currency: string, days: number = 7): Promise<HistoricalRate[]> {
  try {
    const { rows } = await sql`
      SELECT currency, rate, date
      FROM exchange_rates
      WHERE currency = ${currency}
      ORDER BY date DESC
      LIMIT ${days}
    `;
    
    return rows.map(row => ({
      currency: row.currency,
      rate: parseFloat(row.rate),
      date: row.date
    }));
  } catch (error) {
    console.error(`${currency} 과거 데이터 조회 실패:`, error);
    return [];
  }
}

// 환율 데이터 저장 함수
async function saveExchangeRate(currency: string, rate: number, date: string): Promise<void> {
  try {
    await sql`
      INSERT INTO exchange_rates (currency, rate, date)
      VALUES (${currency}, ${rate}, ${date})
      ON CONFLICT (currency, date) 
      DO UPDATE SET rate = ${rate}, created_at = CURRENT_TIMESTAMP
    `;
    console.log(`${currency} 환율 데이터 저장 완료: ${rate} (${date})`);
  } catch (error) {
    console.error(`${currency} 환율 데이터 저장 실패:`, error);
  }
}

// 등락폭과 등락률 계산 함수
function calculateChange(currentRate: number, historicalRates: HistoricalRate[]): { change: string; changePercent: string } {
  if (historicalRates.length === 0) {
    return { change: 'N/A', changePercent: 'N/A' };
  }

  // 가장 최근 과거 데이터 찾기 (오늘 데이터 제외)
  const today = new Date().toISOString().split('T')[0];
  const pastRates = historicalRates.filter(rate => rate.date !== today);
  
  if (pastRates.length === 0) {
    return { change: 'N/A', changePercent: 'N/A' };
  }

  const previousRate = pastRates[0].rate;
  const change = currentRate - previousRate;
  const changePercent = (change / previousRate) * 100;

  return {
    change: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
    changePercent: changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`
  };
}

// 환율 데이터 조회 및 저장 함수
async function fetchAndSaveExchangeRates(): Promise<ExchangeRateData[]> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  
  if (!apiKey) {
    throw new Error('환율 API 키가 설정되지 않았습니다.');
  }

  // USD/KRW 환율 조회
  const usdResponse = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
  if (!usdResponse.ok) {
    throw new Error(`USD 환율 API 오류: ${usdResponse.status}`);
  }
  const usdData = await usdResponse.json();
  
  // JPY/KRW 환율 조회
  const jpyResponse = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/JPY`);
  if (!jpyResponse.ok) {
    throw new Error(`JPY 환율 API 오류: ${jpyResponse.status}`);
  }
  const jpyData = await jpyResponse.json();

  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('ko-KR');

  // 현재 환율 데이터
  const usdRate = usdData.conversion_rates.KRW || 0;
  const jpyRate = (jpyData.conversion_rates.KRW || 0) * 100;

  // 환율 데이터 저장
  await saveExchangeRate('USD/KRW', usdRate, today);
  await saveExchangeRate('100JPY/KRW', jpyRate, today);

  // 과거 데이터 조회
  const usdHistoricalRates = await getHistoricalRates('USD/KRW', 7);
  const jpyHistoricalRates = await getHistoricalRates('100JPY/KRW', 7);

  // 등락폭과 등락률 계산
  const usdChange = calculateChange(usdRate, usdHistoricalRates);
  const jpyChange = calculateChange(jpyRate, jpyHistoricalRates);

  return [
    {
      currency: 'USD/KRW',
      rate: usdRate.toFixed(2),
      change: usdChange.change,
      changePercent: usdChange.changePercent,
      lastUpdate: currentTime
    },
    {
      currency: '100JPY/KRW',
      rate: jpyRate.toFixed(2),
      change: jpyChange.change,
      changePercent: jpyChange.changePercent,
      lastUpdate: currentTime
    }
  ];
}

export async function GET(request: NextRequest) {
  try {
    console.log('환율 정보 API 호출 시작');
    
    const rates = await fetchAndSaveExchangeRates();
    
    console.log('환율 정보 조회 완료:', rates);

    return NextResponse.json({
      rates,
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('환율 정보 API 오류:', error);
    
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    
    return NextResponse.json(
      { 
        error: '환율 정보를 가져오는데 실패했습니다.',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}