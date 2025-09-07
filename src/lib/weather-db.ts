import { sql } from '@vercel/postgres';

export interface WeatherCity {
  id: number;
  city_code: string;
  city_name: string;
  english_name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeatherCityInput {
  city_code: string;
  city_name: string;
  english_name: string;
}

// 활성화된 모든 날씨 지역 조회 (display_order 순으로 정렬)
export async function getWeatherCities(): Promise<WeatherCity[]> {
  try {
    const result = await sql`
      SELECT id, city_code, city_name, english_name, display_order, is_active, created_at, updated_at
      FROM weather_cities
      WHERE is_active = true
      ORDER BY display_order ASC
    `;
    return result.rows as WeatherCity[];
  } catch (error) {
    console.error('날씨 지역 조회 오류:', error);
    throw new Error('날씨 지역을 조회할 수 없습니다.');
  }
}

// 새로운 날씨 지역 추가
export async function addWeatherCity(city: WeatherCityInput): Promise<WeatherCity> {
  try {
    // 가장 높은 display_order 값 조회
    const maxOrderResult = await sql`
      SELECT COALESCE(MAX(display_order), 0) as max_order
      FROM weather_cities
      WHERE is_active = true
    `;
    const maxOrder = maxOrderResult.rows[0]?.max_order || 0;
    const newOrder = maxOrder + 1;

    const result = await sql`
      INSERT INTO weather_cities (city_code, city_name, english_name, display_order)
      VALUES (${city.city_code}, ${city.city_name}, ${city.english_name}, ${newOrder})
      RETURNING id, city_code, city_name, english_name, display_order, is_active, created_at, updated_at
    `;

    return result.rows[0] as WeatherCity;
  } catch (error) {
    console.error('날씨 지역 추가 오류:', error);
    throw new Error('날씨 지역을 추가할 수 없습니다.');
  }
}

// 날씨 지역 수정
export async function updateWeatherCity(id: number, city: Partial<WeatherCityInput>): Promise<WeatherCity> {
  try {
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (city.city_name) {
      updateFields.push(`city_name = $${paramIndex++}`);
      values.push(city.city_name);
    }
    if (city.english_name) {
      updateFields.push(`english_name = $${paramIndex++}`);
      values.push(city.english_name);
    }

    if (updateFields.length === 0) {
      throw new Error('수정할 필드가 없습니다.');
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE weather_cities 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, city_code, city_name, english_name, display_order, is_active, created_at, updated_at
    `;

    const result = await sql.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('해당 ID의 날씨 지역을 찾을 수 없습니다.');
    }

    return result.rows[0] as WeatherCity;
  } catch (error) {
    console.error('날씨 지역 수정 오류:', error);
    throw new Error('날씨 지역을 수정할 수 없습니다.');
  }
}

// 날씨 지역 삭제 (하드 삭제)
export async function deleteWeatherCity(id: number): Promise<void> {
  try {
    const result = await sql`
      DELETE FROM weather_cities
      WHERE id = ${id}
    `;

    if (result.rowCount === 0) {
      throw new Error('해당 ID의 날씨 지역을 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('날씨 지역 삭제 오류:', error);
    throw new Error('날씨 지역을 삭제할 수 없습니다.');
  }
}

// 날씨 지역 순서 변경
export async function reorderWeatherCities(cities: { id: number; display_order: number }[]): Promise<void> {
  try {
    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      await sql`
        UPDATE weather_cities 
        SET display_order = ${i + 1}, updated_at = NOW()
        WHERE id = ${city.id} AND is_active = true
      `;
    }
  } catch (error) {
    console.error('날씨 지역 순서 변경 오류:', error);
    throw new Error('날씨 지역 순서를 변경할 수 없습니다.');
  }
}


