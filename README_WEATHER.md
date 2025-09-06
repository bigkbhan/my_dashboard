# 날씨 섹션 설정 가이드

## OpenWeatherMap API 키 설정

날씨 섹션을 사용하기 위해서는 OpenWeatherMap API 키가 필요합니다.

### 1. API 키 발급
1. [OpenWeatherMap](https://openweathermap.org/)에 가입
2. [API Keys](https://home.openweathermap.org/api_keys) 페이지에서 무료 API 키 발급
3. 발급된 API 키를 복사

### 2. 환경 변수 설정
프로젝트 루트의 `.env.local` 파일에 다음 내용을 추가:

```bash
# OpenWeatherMap API 키
OPENWEATHER_API_KEY=your_api_key_here
```

**중요**: `your_api_key_here` 부분을 실제 발급받은 API 키로 교체해야 합니다.

### 3. API 키 활성화
- API 키 발급 후 활성화까지 최대 2시간 소요될 수 있습니다
- 활성화 전까지는 401 Unauthorized 오류가 발생할 수 있습니다

### 4. 사용 가능한 API
- **무료 플랜**: 분당 60회 호출, 월 1,000,000회 호출
- **5일/3시간 예보**: 현재 시간부터 5일간 3시간 단위 예보
- **지원 지역**: 전 세계 주요 도시

### 5. 기본 설정
- **도시**: 서울 (Seoul, KR)
- **단위**: 섭씨 (Celsius)
- **언어**: 영어 (기본)
- **업데이트**: Refresh 버튼 클릭 시

### 6. 문제 해결
- **API 키 오류**: `.env.local` 파일 확인 및 API 키 재입력
- **데이터 없음**: API 키 활성화 상태 확인
- **네트워크 오류**: 인터넷 연결 상태 확인
- **401 Unauthorized**: API 키가 유효하지 않거나 활성화되지 않음
- **429 Too Many Requests**: API 호출 한도 초과 (잠시 후 재시도)
- **500 Internal Server Error**: 서버 내부 오류 (환경 변수 설정 확인)

### 7. 커스터마이징
`src/app/api/weather/route.ts` 파일에서 다음 설정을 변경할 수 있습니다:
- 도시 변경: `CITY` 변수 수정
- 국가 코드 변경: `COUNTRY_CODE` 변수 수정
- 예보 기간 변경: `cnt` 파라미터 수정 (최대 40개, 5일)
