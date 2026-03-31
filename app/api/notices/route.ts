import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import type { SendNoticeRequest } from '@/lib/types'

// GET /api/notices - 공지 목록 조회
export async function GET(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') ?? 20)
  const page  = Number(searchParams.get('page')  ?? 1)

  let query = supabaseAdmin
    .from('notices')
    .select('*, author:users(name, role), notice_receipts(user_id, read_at, confirmed_at)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  // 점주: 자신에게 해당하는 공지만
  if (session.role === 'store_owner') {
    // RLS가 처리하지만, 명시적 필터도 추가
    query = query.or(
      `target_type.eq.all,` +
      `and(target_type.eq.brand,target_ids.cs.["${session.brand_id}"]),` +
      `and(target_type.eq.store,target_ids.cs.["${session.store_id}"])`
    )
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ notices: data, total: count })
}

// POST /api/notices - 공지 발송
export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session || session.role === 'store_owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: SendNoticeRequest = await req.json()
  const { title, content, type, target_type, target_ids, require_confirm } = body

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '제목과 내용은 필수입니다.' }, { status: 400 })
  }

  // 1. 공지 저장
  const { data: notice, error: noticeErr } = await supabaseAdmin
    .from('notices')
    .insert({
      author_id: session.user_id,
      title: title.trim(),
      content: content.trim(),
      type,
      target_type,
      target_ids,
      require_confirm,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (noticeErr) return NextResponse.json({ error: noticeErr.message }, { status: 500 })

  // 2. 수신자 목록 결정 → notice_receipts 생성
  let recipientQuery = supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'store_owner')

  if (target_type === 'brand' && target_ids.length > 0) {
    recipientQuery = recipientQuery.in('brand_id', target_ids)
  } else if (target_type === 'store' && target_ids.length > 0) {
    recipientQuery = recipientQuery.in('store_id', target_ids)
  }
  // target_type === 'all': 필터 없이 전체

  const { data: recipients } = await recipientQuery

  if (recipients && recipients.length > 0) {
    const receipts = recipients.map(r => ({
      notice_id: notice.id,
      user_id: r.id,
    }))
    await supabaseAdmin.from('notice_receipts').insert(receipts)
  }

  // 3. {점주명}, {매장명} 변수 치환 후 푸시 발송 (예시)
  if (body.send_push && recipients) {
    // 실제 구현: FCM / 카카오 알림톡 연동
    // 여기서는 로그만 출력
    console.log(`[PUSH] 공지 "${title}" → ${recipients.length}명 발송`)
  }

  return NextResponse.json({ success: true, notice_id: notice.id })
}
