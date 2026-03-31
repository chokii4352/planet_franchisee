-- ============================================================
-- 프랜차이즈 통합 플랫폼 · Supabase DB 스키마
-- ============================================================

-- UUID 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. 브랜드 ──────────────────────────────────────────────
CREATE TABLE brands (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,          -- URL 식별자 (ex. redhot)
  primary_color TEXT NOT NULL DEFAULT '#E8593C',
  logo_url      TEXT,
  subdomain     TEXT UNIQUE,                   -- redhot.yourplatform.com
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── 2. 가맹점 ──────────────────────────────────────────────
CREATE TABLE stores (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id   UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  region     TEXT,
  address    TEXT,
  phone      TEXT,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. 사용자 ──────────────────────────────────────────────
-- role: 'hq_admin' | 'brand_manager' | 'store_owner'
-- hq_admin은 brand_id, store_id 모두 NULL
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id      UUID REFERENCES brands(id) ON DELETE SET NULL,
  store_id      UUID REFERENCES stores(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'store_owner'
                  CHECK (role IN ('hq_admin', 'brand_manager', 'store_owner')),
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── 4. 매직링크 인증 토큰 ─────────────────────────────────
CREATE TABLE auth_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 5. 공지 ───────────────────────────────────────────────
-- type        : 'general' | 'urgent' | 'doc' | 'private'
-- target_type : 'all' | 'brand' | 'store'
-- target_ids  : 브랜드 or 매장 UUID 배열 (target_type=all이면 빈 배열)
CREATE TABLE notices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id       UUID NOT NULL REFERENCES users(id),
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'general'
                    CHECK (type IN ('general', 'urgent', 'doc', 'private')),
  target_type     TEXT NOT NULL DEFAULT 'all'
                    CHECK (target_type IN ('all', 'brand', 'store')),
  target_ids      JSONB NOT NULL DEFAULT '[]',  -- UUID[]
  require_confirm BOOLEAN DEFAULT false,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 6. 공지 수신 확인 ─────────────────────────────────────
CREATE TABLE notice_receipts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id    UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at      TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  UNIQUE (notice_id, user_id)
);

-- ── 7. 채팅방 ─────────────────────────────────────────────
-- room_type: 'direct' (1:1) | 'broadcast' (브랜드 전체 채널)
-- direct    → store_id 필수, brand_id 선택
-- broadcast → brand_id 필수, store_id NULL
CREATE TABLE chat_rooms (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id   UUID REFERENCES brands(id) ON DELETE CASCADE,
  store_id   UUID REFERENCES stores(id) ON DELETE SET NULL,
  room_type  TEXT NOT NULL DEFAULT 'direct'
               CHECK (room_type IN ('direct', 'broadcast')),
  name       TEXT,                             -- broadcast 채널 이름
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 8. 메시지 ─────────────────────────────────────────────
-- msg_type: 'text' | 'file' | 'notice_ref' | 'system'
-- file_meta: { name, size, url, mime_type }
CREATE TABLE messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id    UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES users(id),
  content    TEXT NOT NULL,
  msg_type   TEXT NOT NULL DEFAULT 'text'
               CHECK (msg_type IN ('text', 'file', 'notice_ref', 'system')),
  file_meta  JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 9. 메시지 읽음 처리 ───────────────────────────────────
CREATE TABLE message_reads (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (message_id, user_id)
);

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_stores_brand        ON stores(brand_id);
CREATE INDEX idx_users_store         ON users(store_id);
CREATE INDEX idx_users_brand         ON users(brand_id);
CREATE INDEX idx_auth_tokens_token   ON auth_tokens(token);
CREATE INDEX idx_auth_tokens_user    ON auth_tokens(user_id);
CREATE INDEX idx_notices_author      ON notices(author_id);
CREATE INDEX idx_notices_sent_at     ON notices(sent_at DESC);
CREATE INDEX idx_receipts_notice     ON notice_receipts(notice_id);
CREATE INDEX idx_receipts_user       ON notice_receipts(user_id);
CREATE INDEX idx_chat_rooms_store    ON chat_rooms(store_id);
CREATE INDEX idx_chat_rooms_brand    ON chat_rooms(brand_id);
CREATE INDEX idx_messages_room       ON messages(room_id, created_at DESC);
CREATE INDEX idx_message_reads_msg   ON message_reads(message_id);
CREATE INDEX idx_message_reads_user  ON message_reads(user_id);

-- ============================================================
-- Supabase Realtime 활성화 (채팅용)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reads;
ALTER PUBLICATION supabase_realtime ADD TABLE notice_receipts;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE brands         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms     ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads  ENABLE ROW LEVEL SECURITY;

-- 본사 관리자: 전체 읽기/쓰기
CREATE POLICY "hq_admin_all" ON brands         FOR ALL USING (auth.jwt() ->> 'role' = 'hq_admin');
CREATE POLICY "hq_admin_all" ON stores         FOR ALL USING (auth.jwt() ->> 'role' = 'hq_admin');
CREATE POLICY "hq_admin_all" ON notices        FOR ALL USING (auth.jwt() ->> 'role' = 'hq_admin');
CREATE POLICY "hq_admin_all" ON chat_rooms     FOR ALL USING (auth.jwt() ->> 'role' = 'hq_admin');
CREATE POLICY "hq_admin_all" ON messages       FOR ALL USING (auth.jwt() ->> 'role' = 'hq_admin');

-- 점주: 자기 브랜드·매장 데이터만 읽기
CREATE POLICY "store_owner_read_own_brand" ON brands
  FOR SELECT USING (id = (auth.jwt() ->> 'brand_id')::UUID);

CREATE POLICY "store_owner_read_own_store" ON stores
  FOR SELECT USING (id = (auth.jwt() ->> 'store_id')::UUID);

CREATE POLICY "store_owner_read_notices" ON notices
  FOR SELECT USING (
    target_type = 'all'
    OR (target_type = 'brand' AND target_ids ? (auth.jwt() ->> 'brand_id'))
    OR (target_type = 'store' AND target_ids ? (auth.jwt() ->> 'store_id'))
  );

CREATE POLICY "store_owner_read_own_room" ON chat_rooms
  FOR SELECT USING (store_id = (auth.jwt() ->> 'store_id')::UUID);

CREATE POLICY "store_owner_send_message" ON messages
  FOR INSERT WITH CHECK (sender_id = (auth.jwt() ->> 'user_id')::UUID);

CREATE POLICY "store_owner_read_messages" ON messages
  FOR SELECT USING (
    room_id IN (
      SELECT id FROM chat_rooms
      WHERE store_id = (auth.jwt() ->> 'store_id')::UUID
    )
  );

-- ============================================================
-- 샘플 데이터
-- ============================================================
INSERT INTO brands (name, slug, primary_color, subdomain) VALUES
  ('레드핫 피자',   'redhot',    '#E8593C', 'redhot'),
  ('골든크러스트',  'golden',    '#D4900E', 'golden'),
  ('아르테피자',    'arte',      '#2D6FD4', 'arte');
