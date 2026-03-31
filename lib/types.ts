// ============================================================
// 공통 타입 정의
// ============================================================

export type UserRole = 'hq_admin' | 'brand_manager' | 'store_owner'
export type NoticeType = 'general' | 'urgent' | 'doc' | 'private'
export type NoticeTargetType = 'all' | 'brand' | 'store'
export type RoomType = 'direct' | 'broadcast'
export type MessageType = 'text' | 'file' | 'notice_ref' | 'system'

export interface Brand {
  id: string
  name: string
  slug: string
  primary_color: string
  logo_url: string | null
  subdomain: string | null
  created_at: string
}

export interface Store {
  id: string
  brand_id: string
  name: string
  region: string | null
  address: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  brand?: Brand
}

export interface User {
  id: string
  brand_id: string | null
  store_id: string | null
  name: string
  phone: string | null
  role: UserRole
  last_login_at: string | null
  created_at: string
  brand?: Brand
  store?: Store
}

export interface AuthToken {
  id: string
  user_id: string
  token: string
  expires_at: string
  is_used: boolean
  created_at: string
}

export interface Notice {
  id: string
  author_id: string
  title: string
  content: string
  type: NoticeType
  target_type: NoticeTargetType
  target_ids: string[]
  require_confirm: boolean
  sent_at: string | null
  created_at: string
  author?: User
  receipts?: NoticeReceipt[]
}

export interface NoticeReceipt {
  id: string
  notice_id: string
  user_id: string
  read_at: string | null
  confirmed_at: string | null
  user?: User
}

export interface ChatRoom {
  id: string
  brand_id: string | null
  store_id: string | null
  room_type: RoomType
  name: string | null
  is_active: boolean
  created_at: string
  brand?: Brand
  store?: Store
  last_message?: Message
  unread_count?: number
}

export interface FileMeta {
  name: string
  size: number
  url: string
  mime_type: string
}

export interface Message {
  id: string
  room_id: string
  sender_id: string
  content: string
  msg_type: MessageType
  file_meta: FileMeta | null
  created_at: string
  sender?: User
  reads?: MessageRead[]
}

export interface MessageRead {
  id: string
  message_id: string
  user_id: string
  read_at: string
}

// ── API 요청/응답 타입 ────────────────────────────────────

export interface SendNoticeRequest {
  title: string
  content: string
  type: NoticeType
  target_type: NoticeTargetType
  target_ids: string[]
  require_confirm: boolean
  send_push: boolean
  send_kakao: boolean
}

export interface SendMessageRequest {
  room_id: string
  content: string
  msg_type?: MessageType
  file_meta?: FileMeta
}

export interface IssueMagicLinkRequest {
  store_id: string
  expires_days?: number  // 기본 30일
}

// ── 세션 JWT 페이로드 ─────────────────────────────────────
export interface SessionPayload {
  user_id: string
  store_id: string | null
  brand_id: string | null
  role: UserRole
  exp: number
}

// ── 브랜드 테마 (CSS 변수 주입용) ────────────────────────
export interface BrandTheme {
  primaryColor: string
  primaryLight: string   // 연한 배경색
  primaryDark: string    // 어두운 텍스트색
  name: string
  logoUrl: string | null
}
