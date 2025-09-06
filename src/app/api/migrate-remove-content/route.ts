import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
  try {
    console.log('🔧 content 및 translated_content 컬럼 삭제 마이그레이션 시작...');
    
    // content 컬럼 삭제
    await sql`ALTER TABLE lesson_urls DROP COLUMN IF EXISTS content`;
    console.log('✅ content 컬럼 삭제 완료');
    
    // translated_content 컬럼 삭제
    await sql`ALTER TABLE lesson_urls DROP COLUMN IF EXISTS translated_content`;
    console.log('✅ translated_content 컬럼 삭제 완료');
    
    // 테이블 설명 업데이트
    await sql`COMMENT ON TABLE lesson_urls IS 'TalkEnglish.com에서 가져온 영어 레슨 URL과 제목을 저장하는 테이블 (내용과 번역은 실시간으로 추출)'`;
    await sql`COMMENT ON COLUMN lesson_urls.url IS '레슨의 원본 URL'`;
    await sql`COMMENT ON COLUMN lesson_urls.title IS '레슨의 제목'`;
    await sql`COMMENT ON COLUMN lesson_urls.display_date IS '해당 레슨을 표시할 날짜'`;
    await sql`COMMENT ON COLUMN lesson_urls.created_at IS '레코드 생성 시간'`;
    await sql`COMMENT ON COLUMN lesson_urls.updated_at IS '레코드 수정 시간'`;
    console.log('✅ 테이블 설명 업데이트 완료');
    
    return NextResponse.json({ 
      success: true, 
      message: 'content 및 translated_content 컬럼 삭제 마이그레이션이 완료되었습니다.' 
    });
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    return NextResponse.json(
      { 
        error: '마이그레이션에 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
