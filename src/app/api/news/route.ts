import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: '네이버 API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 카테고리별 뉴스 검색
    const categories = [
      { name: '정치', query: '정치' },
      { name: '경제', query: '경제' },
      { name: '사회', query: '사회' },
      { name: '생활/문화', query: '생활문화' },
      { name: 'IT/과학', query: 'IT과학' },
      { name: '세계', query: '세계' }
    ];

    const allNews = [];

    for (const category of categories) {
      const query = encodeURIComponent(category.query);
      const url = `https://openapi.naver.com/v1/search/news.json?query=${query}&display=30&start=1&sort=date`;

      const response = await fetch(url, {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.items && Array.isArray(data.items)) {
          // 뉴스 데이터 가공
          const processedNews = data.items.map((item: any, index: number) => ({
            id: `${category.name}_${index + 1}`,
            category: category.name,
            title: decodeHtmlEntities(item.title.replace(/<[^>]*>/g, '')),
            originallink: item.originallink,
            link: item.link,
            description: decodeHtmlEntities(item.description.replace(/<[^>]*>/g, '')),
            pubDate: item.pubDate,
            summary: generateSummary(decodeHtmlEntities(item.description.replace(/<[^>]*>/g, ''))),
          }));

          allNews.push(...processedNews);
        }
      }
    }

    // 날짜순으로 정렬 (최신순)
    allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return NextResponse.json({
      news: allNews,
      total: allNews.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('뉴스 데이터 조회 실패:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: '뉴스 데이터를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }
  }
}

// HTML 엔티티 디코딩 함수
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#39;': "'",
    '&#34;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
    '&#x2D;': '-',
    '&#x2B;': '+',
    '&#x23;': '#',
    '&#x40;': '@',
    '&#x24;': '$',
    '&#x25;': '%',
    '&#x5E;': '^',
    '&#x26;': '&',
    '&#x2A;': '*',
    '&#x28;': '(',
    '&#x29;': ')',
    '&#x5B;': '[',
    '&#x5D;': ']',
    '&#x7B;': '{',
    '&#x7D;': '}',
    '&#x7C;': '|',
    '&#x5C;': '\\',
    '&#x3A;': ':',
    '&#x3B;': ';',
    '&#x2C;': ',',
    '&#x2E;': '.',
    '&#x3F;': '?',
    '&#x21;': '!',
    '&#x7E;': '~'
  };

  return text.replace(/&[#\w]+;/g, (entity) => {
    return entities[entity] || entity;
  });
}

// 간단한 요약 생성 함수 (실제로는 더 정교한 알고리즘 사용 가능)
function generateSummary(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length <= 2) {
    return text;
  }
  // 첫 2문장을 요약으로 사용
  return sentences.slice(0, 2).join('. ') + '.';
}
