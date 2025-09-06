-- lesson_urls 테이블 생성
CREATE TABLE IF NOT EXISTS lesson_urls (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  translated_content TEXT,
  display_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_lesson_urls_display_date ON lesson_urls(display_date);
CREATE INDEX IF NOT EXISTS idx_lesson_urls_url ON lesson_urls(url);
CREATE INDEX IF NOT EXISTS idx_lesson_urls_created_at ON lesson_urls(created_at);

-- 중복 방지를 위한 유니크 제약 조건
CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_urls_unique ON lesson_urls(display_date, url);

-- 테이블 설명
COMMENT ON TABLE lesson_urls IS 'TalkEnglish.com에서 가져온 영어 레슨 URL과 내용을 저장하는 테이블';
COMMENT ON COLUMN lesson_urls.url IS '레슨의 원본 URL';
COMMENT ON COLUMN lesson_urls.title IS '레슨의 제목';
COMMENT ON COLUMN lesson_urls.content IS '레슨의 영어 내용';
COMMENT ON COLUMN lesson_urls.translated_content IS '번역된 한국어 내용 (선택사항)';
COMMENT ON COLUMN lesson_urls.display_date IS '해당 레슨을 표시할 날짜';
COMMENT ON COLUMN lesson_urls.created_at IS '레코드 생성 시간';
COMMENT ON COLUMN lesson_urls.updated_at IS '레코드 수정 시간';


