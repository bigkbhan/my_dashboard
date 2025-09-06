import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 환경변수 테스트 시작');
    
    const envVars = {
      POSTGRES_URL: process.env.POSTGRES_URL ? '설정됨' : '설정되지 않음',
      COINMARKETCAP_API_KEY: process.env.COINMARKETCAP_API_KEY ? '설정됨' : '설정되지 않음',
      ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY ? '설정됨' : '설정되지 않음',
      BOK_API_KEY: process.env.BOK_API_KEY ? '설정됨' : '설정되지 않음',
      NODE_ENV: process.env.NODE_ENV,
      PWD: process.env.PWD,
      CWD: process.cwd(),
    };
    
    console.log('📋 환경변수 상태:', envVars);
    
    return NextResponse.json({
      success: true,
      message: '환경변수 테스트 완료',
      envVars,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 환경변수 테스트 실패:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '환경변수 테스트에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}


