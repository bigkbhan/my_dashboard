import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    // 주식 Ticker 테이블 생성
    await sql`
      CREATE TABLE IF NOT EXISTS stock_tickers (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(10) NOT NULL UNIQUE,
        company_name VARCHAR(100) NOT NULL,
        sector VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 암호화폐 Ticker 테이블 생성
    await sql`
      CREATE TABLE IF NOT EXISTS crypto_tickers (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(10) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        coin_id VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 기본 주식 데이터 삽입 (중복 방지)
    await sql`
      INSERT INTO stock_tickers (symbol, company_name, sector)
      VALUES 
        ('BMNR', '비트마인 이머전 테크놀로지스스', ''),
        ('FIG', '피그마', ''),
        ('DRIV', '미래 모빌리티 ETF', '')
      ON CONFLICT (symbol) DO NOTHING
    `;

    // 기본 암호화폐 데이터 삽입 (중복 방지)
    await sql`
      INSERT INTO crypto_tickers (symbol, name, coin_id)
      VALUES 
        ('BTC', '비트코인', 'BTC'),
        ('ETH', '이더리움', 'ETH'),
        ('SOL', '솔라나', 'SOL'),
        ('XRP', 'XRP', 'XRP4'),
        ('LINK', '체인링크', 'LINK'),
        ('SUI', '수이', 'SUI'),
        ('NEAR', '니어', 'NEAR'),
        ('ONDO', '온도파이낸스', 'ONDO'),
        ('SEI', '세이', 'SEI'),
        ('STX', '스택스', 'STX'),
        ('DOT', '폴카닷', 'DOT'),
        ('AVAX', '아발란체', 'AVAX'),
        ('HBAR', '헤데라', 'HBAR'),
        ('DOGE', '도지코인', 'DOGE'),
        ('BONK', '봉크', 'BONK'),
        ('POL', '폴리곤에코시스템토큰', 'POL'),
        ('ADA', '카르다노', 'ADA'),
        ('RENDER', '랜더토큰', 'RENDER'),
        ('ETC', '이더리움클래식', 'ETC'),
        ('SHIB', '시바이누', 'SHIB'),
        ('FLOKI', '플로키', 'FLOKI'),
        ('GRT', '더그래프', 'GRT'),
        ('BTT', '비트토렌트', 'BTT'),
        ('ICP', '인터넷컴퓨터', 'ICP'),
        ('ONG', '온톨로지가스', 'ONG')
      ON CONFLICT (symbol) DO NOTHING
    `;

    return NextResponse.json({ 
      message: '데이터베이스가 성공적으로 초기화되었습니다.',
      tables: ['stock_tickers', 'crypto_tickers']
    });

  } catch (error) {
    console.error('데이터베이스 초기화 실패:', error);
    return NextResponse.json(
      { error: '데이터베이스 초기화에 실패했습니다.' },
      { status: 500 }
    );
  }
}


