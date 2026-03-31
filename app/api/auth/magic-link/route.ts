import { NextRequest, NextResponse } from 'next/server'
import { getSession, issueMagicLink } from '@/lib/auth'

// POST /api/auth/magic-link
// 본사 관리자가 점주에게 링크 발급
export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session || session.role === 'store_owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { store_id, expires_days = 30 } = await req.json()
  if (!store_id) {
    return NextResponse.json({ error: 'store_id는 필수입니다.' }, { status: 400 })
  }

  try {
    const token = await issueMagicLink(store_id, expires_days)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://yourplatform.com'
    const link = `${baseUrl}/s/${token}`

    return NextResponse.json({ link, expires_days })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
