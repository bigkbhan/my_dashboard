import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

interface LessonData {
  id: string;
  url: string;
  title: string;
  content: string;
  audioUrl?: string;
  translatedContent?: string;
  displayDate: string;
  timestamp: string;
}

// TalkEnglish.com에서 레슨 URL들을 수집하고 DB에 저장
async function collectLessonUrls(): Promise<string[]> {
  try {
    const response = await fetch('https://www.talkenglish.com/lessonindex.aspx');
    if (!response.ok) {
      throw new Error(`TalkEnglish 사이트 접근 실패: ${response.status}`);
    }
    
    const html = await response.text();
    
    // section class="content" 부분에서 Link 추출
    const contentSectionMatch = html.match(/<section[^>]*class="content"[^>]*>([\s\S]*?)<\/section>/i);
    if (!contentSectionMatch) {
      throw new Error('content 섹션을 찾을 수 없습니다.');
    }
    
    const contentSection = contentSectionMatch[1];
    
    // href 속성을 가진 Link들 추출 (광고 제외)
    const linkMatches = contentSection.match(/href="([^"]*lessondetails\.aspx\?ALID=\d+[^"]*)"/gi);
    if (!linkMatches) {
      throw new Error('레슨 링크를 찾을 수 없습니다.');
    }
    
    const urls: string[] = [];
    for (const match of linkMatches) {
      const url = match.replace(/href="([^"]*)"/i, '$1');
      if (url && !url.includes('advertisement') && !url.includes('ads')) {
        // 상대 URL을 절대 URL로 변환
        const fullUrl = url.startsWith('http') ? url : `https://www.talkenglish.com${url}`;
        urls.push(fullUrl);
      }
    }
    
    console.log(`총 ${urls.length}개의 레슨 URL을 찾았습니다.`);
    return urls;
    
  } catch (error) {
    console.error('레슨 URL 수집 실패:', error);
    throw error;
  }
}

// 특정 레슨의 내용을 가져오기 (HTML 유지 방식)
async function fetchLessonContent(url: string): Promise<{ title: string; content: string; audioUrl: string }> {
  try {
    console.log(`🔍 레슨 내용 추출 시작: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`레슨 페이지 접근 실패: ${response.status}`);
    }
    
    const html = await response.text();
    console.log(`📄 HTML 길이: ${html.length}자`);
    
    let title = '영어 레슨';
    let content = '';
    let audioUrl = '';
    
    // 1. 제목 추출 (h1 태그)
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      title = h1Match[1].trim();
      console.log(`📝 제목: ${title}`);
    }
    
    // 2. sm2-playlist-bd 부분 찾기 (영어 본문)
    const playlistMatch = html.match(/<div[^>]*class="[^"]*sm2-playlist-bd[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    
    if (playlistMatch) {
      console.log(`📖 sm2-playlist-bd 섹션 발견`);
      const playlistContent = playlistMatch[1];
      
      // 3. "Listen to the Entire Lesson" 찾기 및 mp3 링크 처리
      const listenSpanMatch = playlistContent.match(/<span[^>]*>([^<]*Listen to the Entire Lesson[^<]*)<\/span>/i);
      if (listenSpanMatch) {
        const spanContent = listenSpanMatch[0];
        
        // mp3 파일 링크 찾기 (더 정확한 패턴)
        const mp3LinkMatch = spanContent.match(/<a[^>]*href="([^"]*\.mp3[^"]*)"[^>]*>/i);
        if (mp3LinkMatch) {
          audioUrl = mp3LinkMatch[1];
          // 상대 URL을 절대 URL로 변환
          if (!audioUrl.startsWith('http')) {
            audioUrl = `https://www.talkenglish.com${audioUrl}`;
          }
          console.log(`🎵 오디오 URL: ${audioUrl}`);
        } else {
          // span 내에서 직접 mp3 파일 찾기
          const mp3FileMatch = spanContent.match(/href="([^"]*\.mp3[^"]*)"/i);
          if (mp3FileMatch) {
            audioUrl = mp3FileMatch[1];
            if (!audioUrl.startsWith('http')) {
              audioUrl = `https://www.talkenglish.com${audioUrl}`;
            }
            console.log(`🎵 오디오 URL (fallback): ${audioUrl}`);
          }
        }
      }
      
      // 4. 간단하게 문자열 치환으로 제거
      let cleanHtml = playlistContent;
      
      // "Listen to the Entire Lesson" 텍스트만 제거
      cleanHtml = cleanHtml.replace(/Listen to the Entire Lesson/gi, '');
      
      // <a> 태그의 속성과 태그만 제거하고 텍스트는 유지
      cleanHtml = cleanHtml.replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1');
      
      // 빈 span 태그 제거
      cleanHtml = cleanHtml.replace(/<span[^>]*>\s*<\/span>/gi, '');
      
      // 5. table 태그 제거 (이전/다음 강좌 버튼)
      cleanHtml = cleanHtml.replace(/<table[^>]*border="0"[^>]*width="100%"[^>]*>[\s\S]*?<\/table>/gi, '');
      
      // 6. span 태그 내의 a 태그만 제거 (텍스트는 유지)
      cleanHtml = cleanHtml.replace(/<span[^>]*><a[^>]*>([^<]+)<\/a><\/span>/gi, '<span>$1</span>');
      
      // 7. b 태그를 strong 태그로 변환 (더 안전한 HTML)
      cleanHtml = cleanHtml.replace(/<b[^>]*>([^<]+)<\/b>/gi, '<strong>$1</strong>');
      
      content = cleanHtml;
      console.log(`📚 최종 내용 길이: ${content.length}자`);
    }
    
    // 8. fallback: sm2-playlist-bd를 찾지 못한 경우 전체 페이지에서 추출
    if (!content || content.length < 100) {
      console.log(`🔄 전체 페이지에서 내용 추출 시도`);
      
      // sm2-bar-ui 부분 제거
      let cleanHtml = html.replace(/<div[^>]*class="[^"]*sm2-bar-ui[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
      
      // h1 태그 이후의 내용 추출
      const afterH1Match = cleanHtml.match(/<h1[^>]*>.*?<\/h1>([\s\S]*)/i);
      if (afterH1Match) {
        let afterH1 = afterH1Match[1];
        
        // table 태그 제거
        afterH1 = afterH1.replace(/<table[^>]*border="0"[^>]*width="100%"[^>]*>[\s\S]*?<\/table>/gi, '');
        
        // span 태그 내의 a 태그만 제거
        afterH1 = afterH1.replace(/<span[^>]*><a[^>]*>([^<]+)<\/a><\/span>/gi, '<span>$1</span>');
        
        // b 태그를 strong 태그로 변환
        afterH1 = afterH1.replace(/<b[^>]*>([^<]+)<\/b>/gi, '<strong>$1</strong>');
        
        content = afterH1;
        console.log(`📚 fallback 내용 길이: ${content.length}자`);
      }
    }
    
    // 9. 음성 파일 URL 추출 (fallback)
    if (!audioUrl) {
      // 전체 HTML에서 mp3 파일 찾기
      const allMp3Matches = html.match(/href="([^"]*\.mp3[^"]*)"/gi);
      if (allMp3Matches && allMp3Matches.length > 0) {
        // 첫 번째 mp3 파일 사용 (보통 전체 레슨 오디오)
        const mp3File = allMp3Matches[0].replace(/href="([^"]*)"/i, '$1');
        if (mp3File && mp3File.endsWith('.mp3')) {
          audioUrl = mp3File.startsWith('http') ? mp3File : `https://www.talkenglish.com${mp3File}`;
          console.log(`🎵 fallback 오디오 URL: ${audioUrl}`);
        }
      }
    }
    
    // 10. 기본 예시 문장들 (최종 fallback)
    if (!content || content.length < 50) {
      const basicExamples = [
        "Hello, how are you today?",
        "I'm learning English.",
        "Can you help me practice?",
        "Thank you for your time.",
        "Have a great day!"
      ];
      content = basicExamples.join('\n\n');
    }
    
    console.log(`🎉 최종 결과 - 제목: ${title}, 내용 길이: ${content.length}, 오디오: ${audioUrl}`);
    return { title, content, audioUrl };
    
  } catch (error) {
    console.error('레슨 내용 가져오기 실패:', error);
    throw error;
  }
}

// DB에서 오늘 표시할 레슨 가져오기 (content 컬럼 없이)
async function getTodayLesson(date: string): Promise<{ id: string; url: string; title: string; displayDate: string; timestamp: string } | null> {
  try {
    const result = await sql`
      SELECT id, url, title, display_date, created_at as timestamp
      FROM lesson_urls 
      WHERE display_date = ${date}
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    if (result.rows.length > 0) {
      return result.rows[0] as { id: string; url: string; title: string; displayDate: string; timestamp: string };
    }
    
    return null;
  } catch (error) {
    console.error('오늘 레슨 조회 실패:', error);
    return null;
  }
}

// DB에 새로운 레슨 저장 (content 컬럼 없이)
async function saveLessonToDB(url: string, title: string, displayDate: string): Promise<void> {
  try {
    await sql`
      INSERT INTO lesson_urls (url, title, display_date, created_at)
      VALUES (${url}, ${title}, ${displayDate}, NOW())
    `;
    console.log(`레슨이 DB에 저장되었습니다: ${displayDate}`);
  } catch (error) {
    console.error('레슨 DB 저장 실패:', error);
    throw error;
  }
}

// 다음 표시할 레슨 결정 (항상 실시간으로 내용 추출)
async function determineNextLesson(date: string): Promise<LessonData> {
  try {
    // 1. 이미 DB에 저장된 레슨이 있는지 확인
    const existingLesson = await getTodayLesson(date);
    if (existingLesson) {
      // DB에 저장된 레슨이 있으면 해당 URL에서 실시간으로 내용 추출
      const { content, audioUrl } = await fetchLessonContent(existingLesson.url);
      
      return {
        ...existingLesson,
        content,
        audioUrl,
        translatedContent: undefined
      };
    }
    
    // 2. 새로운 레슨을 가져와서 저장
    const urls = await collectLessonUrls();
    
    // 날짜 기반으로 URL 선택 (하루에 하나씩 순차적으로)
    const dateSeed = new Date(date).getTime();
    const urlIndex = Math.floor(dateSeed / (24 * 60 * 60 * 1000)) % urls.length;
    const selectedUrl = urls[urlIndex];
    
    // 선택된 URL의 내용 가져오기
    const { title, content, audioUrl } = await fetchLessonContent(selectedUrl);
    
    // DB에 저장 (content 제외)
    await saveLessonToDB(selectedUrl, title, date);
    
    return {
      id: `lesson_${dateSeed}`,
      url: selectedUrl,
      title,
      content,
      audioUrl,
      displayDate: date,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('다음 레슨 결정 실패:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    console.log(`📅 API 호출: ${date} 날짜의 레슨 요청`);
    
    // 오늘의 레슨 가져오기 (항상 실시간으로 내용 추출)
    const lesson = await determineNextLesson(date);
    
    console.log(`✅ API 응답 완료: ${lesson.title} (${lesson.content.length}자)`);
    
    return new NextResponse(JSON.stringify({
      lesson,
      date,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    
  } catch (error) {
    console.error('영어공부 API 오류:', error);
    return NextResponse.json(
      { 
        error: '영어공부를 가져오는데 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

// 번역 API (POST 요청)
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: '번역할 텍스트가 없습니다.' }, { status: 400 });
    }
    
    // Google Translate API 사용
    const googleTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(googleTranslateUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Google 번역 API 오류: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Google 번역 API 응답 구조:', JSON.stringify(data, null, 2)); // 디버깅용
    
    // Google Translate API는 긴 텍스트를 여러 부분으로 나누어 번역함
    // 모든 번역 결과를 합쳐야 함
    let translatedText = '';
    if (data[0] && Array.isArray(data[0])) {
      console.log('번역 부분 수:', data[0].length); // 디버깅용
      for (let i = 0; i < data[0].length; i++) {
        const translationPart = data[0][i];
        if (translationPart && translationPart[0]) {
          console.log(`번역 부분 ${i + 1}:`, translationPart[0]); // 디버깅용
          translatedText += translationPart[0];
        }
      }
    }
    
    // 번역 결과가 너무 짧으면 재시도
    if (translatedText.length < text.length * 0.3) {
      console.log('번역 결과가 너무 짧음, 재시도 중...');
      
      // 텍스트를 더 작은 부분으로 나누어 재시도
      const sentences = text.split('. ');
      const translatedParts = [];
      
      for (const sentence of sentences) {
        if (sentence.trim()) {
          const sentenceWithPeriod = sentence + '. ';
          const retryResponse = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(sentenceWithPeriod)}`, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            if (retryData[0] && retryData[0][0] && retryData[0][0][0]) {
              translatedParts.push(retryData[0][0][0]);
            }
          }
        }
      }
      
      translatedText = translatedParts.join(' ');
    }
    
    if (!translatedText) {
      throw new Error('번역 결과를 받을 수 없습니다.');
    }
    
    return new NextResponse(JSON.stringify({
      original: text,
      translated: translatedText,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    
  } catch (error) {
    console.error('번역 API 오류:', error);
    return NextResponse.json(
      { 
        error: '번역에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
