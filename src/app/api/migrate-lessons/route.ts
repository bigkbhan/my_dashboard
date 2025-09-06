import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    console.log('lesson_urls 테이블 마이그레이션 시작...');
    
    // lesson_urls 테이블 생성
    await sql`
      CREATE TABLE IF NOT EXISTS lesson_urls (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        translated_content TEXT,
        display_date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    console.log('✅ lesson_urls 테이블 생성 완료');
    
    // 인덱스 생성
    await sql`CREATE INDEX IF NOT EXISTS idx_lesson_urls_display_date ON lesson_urls(display_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lesson_urls_url ON lesson_urls(url)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lesson_urls_created_at ON lesson_urls(created_at)`;
    
    console.log('✅ 인덱스 생성 완료');
    
    // 중복 방지를 위한 유니크 제약 조건
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_urls_unique ON lesson_urls(display_date, url)`;
    
    console.log('✅ 유니크 제약 조건 생성 완료');
    
    // 테이블 설명 추가
    await sql`COMMENT ON TABLE lesson_urls IS 'TalkEnglish.com에서 가져온 영어 레슨 URL과 내용을 저장하는 테이블'`;
    
    console.log('✅ 테이블 설명 추가 완료');
    
    return NextResponse.json({
      success: true,
      message: 'lesson_urls 테이블 마이그레이션이 성공적으로 완료되었습니다.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('마이그레이션 실패:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '마이그레이션에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}


