import { NextRequest, NextResponse } from 'next/server';

interface Quote {
  id: string;
  text: string;
  author: string;
  source?: string;
  wikipedia?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    // 외부 API에서 명언 가져오기 (하루에 하나의 명언)
    const quotes: Quote[] = [];
    
    try {
      // 하루에 하나의 명언만 가져오기
      const response = await fetch('https://api.sobabear.com/happiness/random-quote', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'My-Dashboard-App/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // API 응답 구조에 따라 데이터 추출
        if (data.data && data.data.content) {
          const quote: Quote = {
            id: `${date}_1`,
            text: data.data.content,
            author: data.data.author || '작자미상',
            source: data.data.description || undefined,
            wikipedia: data.data.link || undefined
          };
          quotes.push(quote);
        } else {
          throw new Error('API 응답에 명언 데이터가 없습니다.');
        }
      } else {
        throw new Error(`API 응답 오류: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('명언 조회 실패:', error);
      throw new Error(`명언 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    if (quotes.length === 0) {
      throw new Error('명언 조회에 실패했습니다.');
    }

    return new NextResponse(JSON.stringify({
      quotes,
      date,
      total: quotes.length,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('명언 API 오류:', error);
    return NextResponse.json(
      { 
        error: '명언을 가져오는데 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
