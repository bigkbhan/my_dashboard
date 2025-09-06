import { NextRequest, NextResponse } from 'next/server';
import { reorderWeatherCities } from '@/lib/weather-db';

export async function PUT(request: NextRequest) {
  try {
    const { cities } = await request.json();

    if (!Array.isArray(cities) || cities.length === 0) {
      return NextResponse.json(
        { error: '유효한 도시 목록이 필요합니다.' },
        { status: 400 }
      );
    }

    await reorderWeatherCities(cities);
    
    return NextResponse.json({
      message: '날씨 지역 순서가 성공적으로 업데이트되었습니다.',
      updatedCount: cities.length
    });

  } catch (error) {
    console.error('날씨 지역 순서 변경 오류:', error);
    return NextResponse.json(
      { error: '날씨 지역 순서 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


