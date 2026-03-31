import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/chat/rooms
export async function GET(req: NextRequest) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 채팅방 + 마지막 메시지 + 미읽음 수
  const { data: rooms, error } = await supabaseAdmin
    .from('chat_rooms')
    .select(`
      *,
      brand:brands(id, name, slug, primary_color),
      store:stores(id, name, region)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 각 방의 마지막 메시지 + 미읽음 수 조회
  const enriched = await Promise.all(
    (rooms ?? []).map(async room => {
      const { data: lastMsg } = await supabaseAdmin
        .from('messages')
        .select('content, created_at')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // 미읽음: 내가 읽지 않은 메시지 수
      const { count } = await supabaseAdmin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('room_id', room.id)
        .not('id', 'in',
          `(SELECT message_id FROM message_reads WHERE user_id = '${session.user_id}')`
        )

      return {
        ...room,
        lastMsg: lastMsg?.content ?? null,
        lastAt: lastMsg?.created_at
          ? new Date(lastMsg.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
          : null,
        unread: count ?? 0,
      }
    })
  )

  return NextResponse.json({ rooms: enriched })
}
