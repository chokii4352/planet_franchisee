# 🍕 프랜차이즈 통합 플랫폼

본사-가맹점 실시간 소통 웹 플랫폼 (Next.js 14 + Supabase)

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | Next.js 14 (App Router), TypeScript |
| 백엔드 | Next.js API Routes (서버리스) |
| DB + 실시간 | Supabase (PostgreSQL + Realtime WebSocket) |
| 인증 | JWT 매직링크 (설치 없이 링크 클릭 1번) |
| 배포 | Vercel (권장) |

---

## 프로젝트 구조

```
franchise-platform/
├── schema.sql                        # DB 스키마 (Supabase에서 실행)
├── .env.example                      # 환경변수 예시
├── app/
│   ├── s/[token]/page.tsx            # 매직링크 진입 (점주 링크 클릭 시)
│   ├── store/                        # 점주 앱
│   │   ├── layout.tsx                # 브랜드 테마 자동 주입
│   │   ├── page.tsx                  # 홈 (공지 요약 + 매장 정보)
│   │   ├── chat/page.tsx             # 본사 채팅
│   │   └── notices/page.tsx          # 공지 목록
│   ├── hq/                           # 본사 관리자
│   │   ├── layout.tsx                # 사이드바 레이아웃
│   │   ├── page.tsx                  # 대시보드
│   │   ├── notices/page.tsx          # 공지 발송 (브랜드/매장 타겟팅)
│   │   └── chat/page.tsx             # 채팅 관리
│   └── api/
│       ├── auth/magic-link/route.ts  # 매직링크 발급
│       ├── notices/route.ts          # 공지 CRUD
│       └── chat/messages/route.ts    # 채팅 메시지
├── lib/
│   ├── types.ts                      # 공통 TypeScript 타입
│   ├── supabase.ts                   # Supabase 클라이언트
│   └── auth.ts                       # JWT 인증 유틸
└── components/
    └── ui/StoreNav.tsx               # 점주 하단 내비게이션
```

---

## 시작하기

### 1. 저장소 클론 및 의존성 설치

```bash
git clone https://github.com/your-org/franchise-platform.git
cd franchise-platform
npm install
```

### 2. Supabase 프로젝트 생성

1. https://supabase.com 접속 → 새 프로젝트 생성
2. SQL Editor에서 `schema.sql` 전체 실행
3. 프로젝트 설정 → API → URL, anon key, service_role key 복사

### 3. 환경변수 설정

```bash
cp .env.example .env.local
# .env.local 파일을 열고 Supabase 키와 JWT_SECRET 입력
```

JWT_SECRET 생성 방법:
```bash
openssl rand -base64 32
```

### 4. 개발 서버 실행

```bash
npm run dev
# http://localhost:3000
```

---

## 주요 기능 흐름

### 점주 접속 (매직링크)

1. 본사가 `/api/auth/magic-link` 호출 → 링크 발급
2. 점주가 링크 클릭 → `/s/{token}` 진입
3. 토큰 검증 → 세션 쿠키 발급 → `/store` 리다이렉트
4. 브랜드 테마(색상, 로고) 자동 적용

### 공지 발송 (3단계 타겟팅)

```
전체 발송   → target_type: 'all'
브랜드 발송 → target_type: 'brand', target_ids: [brand_id, ...]
매장 발송   → target_type: 'store', target_ids: [store_id, ...]
```

공지 발송 시 자동으로 `notice_receipts` 레코드 생성 → 읽음/확인 추적

### 실시간 채팅

- Supabase Realtime WebSocket으로 메시지 즉시 수신
- `messages` 테이블 INSERT 이벤트 구독
- `message_reads` 테이블로 읽음 처리

---

## 배포 (Vercel)

```bash
npm install -g vercel
vercel

# 환경변수 설정 (Vercel 대시보드 또는 CLI)
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add JWT_SECRET
vercel env add NEXT_PUBLIC_BASE_URL
```

---

## 확장 포인트

| 기능 | 방법 |
|------|------|
| 카카오 알림톡 | `/api/notices/route.ts`의 push 발송 부분에 카카오 API 연동 |
| 파일 첨부 | Supabase Storage 연동 후 `file_meta` 필드 활용 |
| 브랜드 추가 | `brands` 테이블에 INSERT 후 자동 적용 |
| PWA 변환 | `next-pwa` 패키지 추가로 홈 화면 추가 지원 |
| 다국어 지원 | `next-intl` 패키지 활용 |
