import { NextRequest, NextResponse } from 'next/server';

// OpenWeatherMap API 설정
const API_KEY = process.env.OPENWEATHER_API_KEY;
const CITY = 'Seoul'; // 서울 기준
const COUNTRY_CODE = 'KR';

export async function GET(request: NextRequest) {
  try {
    // URL에서 지역 파라미터 추출
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'Seoul';
    const countryCode = searchParams.get('country') || 'KR';
    
    // API 키 확인
    if (!API_KEY || API_KEY === 'your_api_key_here') {
      console.error('OpenWeatherMap API 키가 설정되지 않았습니다.');
      return NextResponse.json(
        { 
          error: 'OpenWeatherMap API 키가 설정되지 않았습니다.',
          details: '환경 변수 OPENWEATHER_API_KEY를 설정해주세요.'
        },
        { status: 500 }
      );
    }

    // 현재 위치의 날씨 예보 조회 (3시간 단위, 24시간)
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city},${countryCode}&appid=${API_KEY}&units=metric&cnt=8`;
    
    console.log('날씨 API 호출 URL:', forecastUrl.replace(API_KEY, '***'));
    
    const response = await fetch(forecastUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MyDashboard/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenWeatherMap API 응답 오류:', response.status, errorText);
      
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'API 키가 유효하지 않습니다.',
            details: 'API 키를 확인하거나 활성화 상태를 확인해주세요.'
          },
          { status: 401 }
        );
      } else if (response.status === 429) {
        return NextResponse.json(
          { 
            error: 'API 호출 한도를 초과했습니다.',
            details: '잠시 후 다시 시도해주세요.'
          },
          { status: 429 }
        );
      } else {
        return NextResponse.json(
          { 
            error: `OpenWeatherMap API 오류: ${response.status}`,
            details: errorText
          },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    
    // API 응답 구조 확인
    if (!data.list || !Array.isArray(data.list)) {
      console.error('예상치 못한 API 응답 구조:', data);
      return NextResponse.json(
        { 
          error: '예상치 못한 API 응답 구조입니다.',
          details: 'API 응답 형식이 변경되었을 수 있습니다.'
        },
        { status: 500 }
      );
    }
    
    // 3시간 단위 데이터 처리
    const forecast = data.list.map((item: {
      dt_txt: string;
      main: {
        temp: number;
        humidity: number;
      };
      weather: Array<{
        description: string;
        icon: string;
      }>;
    }) => ({
      time: item.dt_txt,
      temperature: item.main.temp,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      humidity: item.main.humidity,
    }));

    console.log('날씨 데이터 처리 완료:', forecast.length, '개 항목');

    return NextResponse.json({
      forecast,
      city: data.city.name,
      country: data.city.country,
      timestamp: new Date().toISOString(),
      selectedCity: city,
      selectedCountry: countryCode
    });

  } catch (error) {
    console.error('날씨 API 오류:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: '날씨 데이터를 조회할 수 없습니다.',
          details: error.message
        },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { 
          error: '알 수 없는 오류가 발생했습니다.',
          details: '네트워크 연결을 확인해주세요.'
        },
        { status: 500 }
      );
    }
  }
}
