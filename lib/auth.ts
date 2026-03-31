import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabase'
import type { SessionPayload, BrandTheme } from './types'

const JWT_SECRET = process.env.JWT_SECRET!
const SESSION_COOKIE = 'fp_session'

// ── 매직링크 토큰 생성 ────────────────────────────────────
export async function issueMagicLink(
  storeId: string,
  expiresDays = 30
): Promise<string> {
  // 1. store → user 조회
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, brand_id, store_id, role')
    .eq('store_id', storeId)
    .eq('role', 'store_owner')
    .single()

  if (!user) throw new Error('해당 매장의 점주 계정이 없습니다.')

  // 2. JWT 생성
  const payload: SessionPayload = {
    user_id: user.id,
    store_id: user.store_id,
    brand_id: user.brand_id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * expiresDays,
  }
  const token = jwt.sign(payload, JWT_SECRET)

  // 3. DB에 저장
  await supabaseAdmin.from('auth_tokens').insert({
    user_id: user.id,
    token,
    expires_at: new Date(payload.exp * 1000).toISOString(),
  })

  return token
}

// ── 매직링크 토큰 검증 → 세션 쿠키 발급 ─────────────────
export async function verifyMagicToken(token: string): Promise<SessionPayload> {
  // 1. DB에서 토큰 확인
  const { data: record } = await supabaseAdmin
    .from('auth_tokens')
    .select('*')
    .eq('token', token)
    .eq('is_used', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!record) throw new Error('유효하지 않거나 만료된 링크입니다.')

  // 2. JWT 검증
  const payload = jwt.verify(token, JWT_SECRET) as SessionPayload

  // 3. 마지막 로그인 시각 업데이트
  await supabaseAdmin
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', payload.user_id)

  return payload
}

// ── 세션 쿠키 저장 ────────────────────────────────────────
export function setSessionCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,  // 30일
    path: '/',
  })
}

// ── 세션 읽기 ─────────────────────────────────────────────
export function getSession(): SessionPayload | null {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as SessionPayload
  } catch {
    return null
  }
}

// ── 세션 삭제 (로그아웃) ─────────────────────────────────
export function clearSession() {
  const cookieStore = cookies()
  cookieStore.delete(SESSION_COOKIE)
}

// ── 브랜드 테마 생성 ──────────────────────────────────────
// primaryColor(hex)를 기반으로 밝은/어두운 파생 색상 계산
export function buildBrandTheme(
  primaryColor: string,
  name: string,
  logoUrl: string | null
): BrandTheme {
  // hex → RGB 분해
  const hex = primaryColor.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  // 밝은 배경색 (투명도 10%)
  const primaryLight = `rgba(${r},${g},${b},0.10)`

  // 어두운 텍스트색 (20% 어둡게)
  const dr = Math.max(0, Math.floor(r * 0.75))
  const dg = Math.max(0, Math.floor(g * 0.75))
  const db = Math.max(0, Math.floor(b * 0.75))
  const primaryDark = `rgb(${dr},${dg},${db})`

  return { primaryColor, primaryLight, primaryDark, name, logoUrl }
}
