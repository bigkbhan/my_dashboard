-- lesson_urls 테이블에서 content 컬럼과 translated_content 컬럼 삭제
ALTER TABLE lesson_urls DROP COLUMN IF EXISTS content;
ALTER TABLE lesson_urls DROP COLUMN IF EXISTS translated_content;

-- 테이블 설명 업데이트
COMMENT ON TABLE lesson_urls IS 'TalkEnglish.com에서 가져온 영어 레슨 URL과 제목을 저장하는 테이블 (내용과 번역은 실시간으로 추출)';
COMMENT ON COLUMN lesson_urls.url IS '레슨의 원본 URL';
COMMENT ON COLUMN lesson_urls.title IS '레슨의 제목';
COMMENT ON COLUMN lesson_urls.display_date IS '해당 레슨을 표시할 날짜';
COMMENT ON COLUMN lesson_urls.created_at IS '레코드 생성 시간';
COMMENT ON COLUMN lesson_urls.updated_at IS '레코드 수정 시간';
