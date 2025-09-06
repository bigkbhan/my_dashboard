import { NextResponse } from 'next/server';

interface FortuneData {
  date: string;
  fortunes: Array<{
    number: string;
    name: string;
    title: string;
    description: string;
    imageUrl: string;
  }>;
}

// 오늘의 운세 데이터 조회
async function fetchFortuneData(): Promise<FortuneData> {
  try {
    // 한국 시간대를 고려한 현재 날짜 계산
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const today = koreaTime.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    const url = `https://www.unsin.co.kr/unse/free/todayline/result?setDate=${today}`;
    
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`운세 API 오류: ${response.status}`);
    }
    
    const html = await response.text();
    
    // 12개의 띠 정보 추출
    const fortunes = [];
    
    // UI 표시 순서 (쥐띠부터 시작)
    const uiZodiacNames = [
      '쥐띠', '소띠', '범띠', '토끼띠', '용띠', '뱀띠',
      '말띠', '양띠', '원숭이띠', '닭띠', '개띠', '돼지띠'
    ];
    
    
    
    // HTML에서 운세 데이터 추출
    try {
      // 실제 HTML 구조에 맞는 정확한 정규식 패턴
      const namePatterns = [
        /<span[^>]*id="ani_line_name"[^>]*>([^<]+)<\/span>/g,
        /id="ani_line_name"[^>]*>([^<]+)<\/span>/g
      ];
      
      const titlePatterns = [
        /<div[^>]*class="[^"]*title-txt[^"]*"[^>]*>([^<]+)<\/div>/g,
        /class="title-txt"[^>]*>([^<]+)<\/div>/g
      ];
      
      const descPatterns = [
        /<div[^>]*class="[^"]*result-txt[^"]*"[^>]*>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>[\s\S]*?<\/div>/g,
        /class="result-txt"[^>]*>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>[\s\S]*?<\/div>/g
      ];
      
      let nameMatches: string[] = [];
      let titleMatches: string[] = [];
      let descMatches: string[] = [];
      
      // 여러 패턴으로 시도
      for (const pattern of namePatterns) {
        const matches = html.match(pattern);
        if (matches && matches.length > 0) {
          nameMatches = matches;
          break;
        }
      }
      
      for (const pattern of titlePatterns) {
        const matches = html.match(pattern);
        if (matches && matches.length > 0) {
          titleMatches = matches;
          break;
        }
      }
      
      for (const pattern of descPatterns) {
        const matches = html.match(pattern);
        if (matches && matches.length > 0) {
          descMatches = matches;
          break;
        }
      }
      
      // 각 매치에서 텍스트 추출
      const names = nameMatches.map(match => {
        return match.replace(/<[^>]*>/g, '').trim();
      });
      
      const titles = titleMatches.map(match => {
        return match.replace(/<[^>]*>/g, '').trim();
      });
      
      // 운세 내용을 더 정확하게 파싱
      const descriptions = descMatches.map(match => {
        // <ul> 안의 내용에서 <li> 요소들을 추출
        const liMatches = match.match(/<li[^>]*>[\s\S]*?<\/li>/g) || [];
        const liTexts = liMatches.map(li => {
          // <span class="year-tit">와 <span> 내용을 추출
          const yearMatch = li.match(/<span[^>]*class="[^"]*year-tit[^"]*"[^>]*>([^<]+)<\/span>/);
          const contentMatch = li.match(/<span[^>]*>([^<]+)<\/span>/g);
          
          const year = yearMatch ? yearMatch[1] : '';
          // 연도가 중복되지 않도록 처리
          let content = '';
          if (contentMatch && contentMatch.length > 1) {
            // 첫 번째 span은 연도이므로 제외하고 나머지 내용만 추출
            content = contentMatch.slice(1).map(c => c.replace(/<[^>]*>/g, '').trim()).join(' ');
          } else if (contentMatch && contentMatch.length === 1) {
            content = contentMatch[0].replace(/<[^>]*>/g, '').trim();
          }
          
          // bullet 기호와 함께 반환
          return `• ${year} ${content}`;
        });
        
        return liTexts.join('\n');
      });
      
      // 웹사이트 순서대로 파싱한 데이터를 Map으로 저장
      const parsedFortunes = new Map();
      
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const title = titles[i] || '운세 정보를 불러올 수 없습니다.';
        const description = descriptions[i] || '운세 내용을 불러올 수 없습니다.';
        
        parsedFortunes.set(name, { name, title, description });
      }
      
      // UI 순서대로 12개의 띠 정보 생성
      for (let i = 0; i < 12; i++) {
        const zodiacNumber = (i + 1).toString().padStart(2, '0');
        const zodiacName = uiZodiacNames[i];
        
        // 파싱된 데이터에서 해당 띠의 정보 찾기
        let fortuneData = {
          number: zodiacNumber,
          name: zodiacName,
          title: '운세 정보를 불러올 수 없습니다.',
          description: '운세 내용을 불러올 수 없습니다.',
          imageUrl: `/images/ani_${zodiacNumber}.png`
        };
        
        // 띠명으로 정확한 매칭 시도
        for (const [parsedName, parsedData] of parsedFortunes) {
          if (parsedName === zodiacName) {
            fortuneData = {
              number: zodiacNumber,
              name: zodiacName,
              title: parsedData.title,
              description: parsedData.description,
              imageUrl: `/images/ani_${zodiacNumber}.png`
            };
            break;
          }
        }
        
        fortunes.push(fortuneData);
      }
      
    } catch (parseError) {
      // 파싱 실패 시 기본 데이터로 폴백
      for (let i = 0; i < 12; i++) {
        const zodiacNumber = (i + 1).toString().padStart(2, '0');
        const zodiacName = uiZodiacNames[i];
        
        const fortuneData = {
          number: zodiacNumber,
          name: zodiacName,
          title: '운세 정보를 불러올 수 없습니다.',
          description: '운세 내용을 불러올 수 없습니다.',
          imageUrl: `/images/ani_${zodiacNumber}.png`
        };
        
        fortunes.push(fortuneData);
      }
    }
    
    return {
      date: today,
      fortunes: fortunes
    };
    
  } catch (error) {
    throw new Error(`운세 데이터 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

export async function GET() {
  try {
    const data = await fetchFortuneData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        date: new Date().toISOString().split('T')[0],
        fortunes: [],
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

