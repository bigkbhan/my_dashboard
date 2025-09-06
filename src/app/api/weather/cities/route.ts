import { NextRequest, NextResponse } from 'next/server';
import { getWeatherCities, addWeatherCity } from '@/lib/weather-db';

// GET: 모든 활성화된 날씨 지역 조회
export async function GET() {
  try {
    const cities = await getWeatherCities();
    return NextResponse.json({ cities });
  } catch (error) {
    console.error('날씨 지역 조회 오류:', error);
    return NextResponse.json(
      { error: '날씨 지역을 조회할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새로운 날씨 지역 추가
export async function POST(request: NextRequest) {
  try {
    const { city_code, city_name, english_name } = await request.json();

    if (!city_code || !city_name || !english_name) {
      return NextResponse.json(
        { error: '도시 코드, 도시명, 영문명이 모두 필요합니다.' },
        { status: 400 }
      );
    }

    const newCity = await addWeatherCity({ city_code, city_name, english_name });
    
    return NextResponse.json({
      message: '날씨 지역이 성공적으로 추가되었습니다.',
      city: newCity
    }, { status: 201 });

  } catch (error) {
    console.error('날씨 지역 추가 오류:', error);
    return NextResponse.json(
      { error: '날씨 지역을 추가할 수 없습니다.' },
      { status: 500 }
    );
  }
}


