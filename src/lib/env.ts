import { config } from 'dotenv';
import { resolve } from 'path';

// .env.local 파일 로딩
config({ path: resolve(process.cwd(), '.env.local') });

// 환경변수 타입 정의
export interface EnvVars {
  POSTGRES_URL: string;
  COINMARKETCAP_API_KEY: string;
  ALPHA_VANTAGE_API_KEY: string;
  BOK_API_KEY: string;
}

// 환경변수 검증 및 반환
export function getEnvVars(): EnvVars {
  const requiredVars = [
    'POSTGRES_URL',
    'COINMARKETCAP_API_KEY',
    'ALPHA_VANTAGE_API_KEY',
    'BOK_API_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ 누락된 환경변수:', missingVars);
    throw new Error(`필수 환경변수가 누락되었습니다: ${missingVars.join(', ')}`);
  }

  return {
    POSTGRES_URL: process.env.POSTGRES_URL!,
    COINMARKETCAP_API_KEY: process.env.COINMARKETCAP_API_KEY!,
    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY!,
    BOK_API_KEY: process.env.BOK_API_KEY!
  };
}

// 개별 환경변수 가져오기
export function getEnvVar(name: keyof EnvVars): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`환경변수 ${name}이 설정되지 않았습니다.`);
  }
  return value;
}


