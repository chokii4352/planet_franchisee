import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 브라우저 + 서버 공용 클라이언트
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 서버 전용 관리자 클라이언트 (RLS 우회)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// 서버 컴포넌트용 (동일하게 supabase 사용)
export function createServerSupabase() {
  return supabase
}
