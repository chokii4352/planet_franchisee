import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import type { SendMessageRequest } from '@/lib/types'

// GET /api/chat/messages?room_id=xxx&before=ISO_DATE&limit=50
export async function GET(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('room_id')
  const before = searchParams.get('before')          // 커서 페이지네이션
  const limit  = Number(searchParams.get('limit') ?? 50)

  if (!roomId) return NextResponse.json({ error: 'room_id 필수' }, { status: 400 })

  // 점주는 자기 채팅방만 접근 가능 (RLS가 처리하지만 명시적 확인)
  if (session.role === 'store_owner') {
    const { data: room } = await supabaseAdmin
      .from('chat_rooms')
      .select('store_id')
      .eq('id', roomId)
      .single()
    if (room?.store_id !== session.store_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  let query = supabaseAdmin
    .from('messages')
    .select('*, sender:users(id, name, role)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 읽음 처리
  if (data && data.length > 0) {
    const messageIds = data.map((m: any) => m.id)
    await supabaseAdmin.from('message_reads').upsert(
      messageIds.map((msgId: string) => ({
        message_id: msgId,
        user_id: session.user_id,
        read_at: new Date().toISOString(),
      })),
      { onConflict: 'message_id,user_id', ignoreDuplicates: true }
    )
  }

  // 오래된 순으로 반환
  return NextResponse.json({ messages: (data ?? []).reverse() })
}

// POST /api/chat/messages - 메시지 전송
export async function POST(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: SendMessageRequest = await req.json()
  const { room_id, content, msg_type = 'text', file_meta } = body

  if (!room_id || !content?.trim()) {
    return NextResponse.json({ error: 'room_id, content 필수' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({
      room_id,
      sender_id: session.user_id,
      content: content.trim(),
      msg_type,
      file_meta: file_meta ?? null,
    })
    .select('*, sender:users(id, name, role)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 자동 읽음 처리 (발신자 본인)
  await supabaseAdmin.from('message_reads').insert({
    message_id: data.id,
    user_id: session.user_id,
    read_at: new Date().toISOString(),
  })

  return NextResponse.json({ message: data })
}
