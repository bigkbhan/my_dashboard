-- 한국주식 티커 테이블 생성
CREATE TABLE IF NOT EXISTS korean_stock_tickers (
    id SERIAL PRIMARY KEY,
    ticker_code VARCHAR(20) NOT NULL UNIQUE,
    ticker_name VARCHAR(100) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_korean_stock_tickers_active ON korean_stock_tickers(is_active);
CREATE INDEX IF NOT EXISTS idx_korean_stock_tickers_order ON korean_stock_tickers(display_order);

-- 기본 데이터 삽입 (예시)
INSERT INTO korean_stock_tickers (ticker_code, ticker_name, display_order) VALUES
('005930', '삼성전자', 1),
('000660', 'SK하이닉스', 2),
('035420', 'NAVER', 3),
('051910', 'LG화학', 4),
('006400', '삼성SDI', 5)
ON CONFLICT (ticker_code) DO NOTHING;
