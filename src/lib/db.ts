import { sql } from '@vercel/postgres';

export interface StockTicker {
  id: number;
  symbol: string;
  company_name: string;
  sector: string;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CryptoTicker {
  id: number;
  symbol: string;
  name: string;
  coin_id: string;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

// 주식 Ticker 목록 조회
export async function getStockTickers(): Promise<StockTicker[]> {
  try {
    const result = await sql`
      SELECT id, symbol, company_name, sector, is_active, display_order, created_at, updated_at
      FROM stock_tickers
      WHERE is_active = true
      ORDER BY display_order ASC, id ASC
    `;
    return result.rows as StockTicker[];
  } catch (error) {
    console.error('주식 Ticker 조회 실패:', error);
    return [];
  }
}

// 암호화폐 Ticker 목록 조회
export async function getCryptoTickers(): Promise<CryptoTicker[]> {
  try {
    const result = await sql`
      SELECT id, symbol, name, coin_id, is_active, display_order, created_at, updated_at
      FROM crypto_tickers
      WHERE is_active = true
      ORDER BY display_order ASC, id ASC
    `;
    return result.rows as CryptoTicker[];
  } catch (error) {
    console.error('암호화폐 Ticker 조회 실패:', error);
    return [];
  }
}

// 주식 Ticker 추가
export async function addStockTicker(symbol: string, company_name: string, sector?: string): Promise<boolean> {
  try {
    await sql`
      INSERT INTO stock_tickers (symbol, company_name, sector)
      VALUES (${symbol.toUpperCase()}, ${company_name}, ${sector || null})
    `;
    return true;
  } catch (error) {
    console.error('주식 Ticker 추가 실패:', error);
    return false;
  }
}

// 암호화폐 Ticker 추가
export async function addCryptoTicker(symbol: string, name: string, coin_id?: string): Promise<boolean> {
  try {
    await sql`
      INSERT INTO crypto_tickers (symbol, name, coin_id)
      VALUES (${symbol.toUpperCase()}, ${name}, ${coin_id || null})
    `;
    return true;
  } catch (error) {
    console.error('암호화폐 Ticker 추가 실패:', error);
    return false;
  }
}

// 주식 Ticker 수정
export async function updateStockTicker(id: number, symbol: string, company_name: string, sector?: string): Promise<boolean> {
  try {
    await sql`
      UPDATE stock_tickers
      SET symbol = ${symbol.toUpperCase()}, company_name = ${company_name}, sector = ${sector || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
    return true;
  } catch (error) {
    console.error('주식 Ticker 수정 실패:', error);
    return false;
  }
}

// 암호화폐 Ticker 수정
export async function updateCryptoTicker(id: number, symbol: string, name: string, coin_id?: string): Promise<boolean> {
  try {
    await sql`
      UPDATE crypto_tickers
      SET symbol = ${symbol.toUpperCase()}, name = ${name}, coin_id = ${coin_id || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
    return true;
  } catch (error) {
    console.error('암호화폐 Ticker 수정 실패:', error);
    return false;
  }
}

// 주식 Ticker 삭제 (비활성화)
export async function deleteStockTicker(id: number): Promise<boolean> {
  try {
    await sql`
      UPDATE stock_tickers
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
    return true;
  } catch (error) {
    console.error('주식 Ticker 삭제 실패:', error);
    return false;
  }
}

// 암호화폐 Ticker 삭제 (비활성화)
export async function deleteCryptoTicker(id: number): Promise<boolean> {
  try {
    await sql`
      UPDATE crypto_tickers
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
    return true;
  } catch (error) {
    console.error('암호화폐 Ticker 삭제 실패:', error);
    return false;
  }
}
