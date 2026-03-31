'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ChatRoom, Message } from '@/lib/types'

const BRAND_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  redhot: { bg: '#FFF0EE', text: '#C04828', dot: '#C04828' },
  golden: { bg: '#FFF8E8', text: '#9B6A0A', dot: '#D4900E' },
  arte:   { bg: '#EBF3FF', text: '#1A4EA8', dot: '#2D6FD4' },
}

export default function HQChatPage() {
  const [rooms, setRooms] = useState<(ChatRoom & { unread: number; lastMsg?: string; lastAt?: string })[]>([])
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const bottomRef = useRef<HTMLDivElement>(null)

  // 채팅방 목록 로드
  useEffect(() => {
    fetch('/api/chat/rooms')
      .then(r => r.json())
      .then(({ rooms }) => setRooms(rooms ?? []))
  }, [])

  // 메시지 로드
  useEffect(() => {
    if (!activeRoom) return
    fetch(`/api/chat/messages?room_id=${activeRoom.id}`)
      .then(r => r.json())
      .then(({ messages }) => setMessages(messages ?? []))
  }, [activeRoom])

  // 실시간 구독
  useEffect(() => {
    if (!activeRoom) return
    const channel = supabase
      .channel(`hq-room:${activeRoom.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `room_id=eq.${activeRoom.id}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeRoom])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activeRoom) return
    const content = input.trim()
    setInput('')
    await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: activeRoom.id, content }),
    })
  }, [input, activeRoom])

  const filteredRooms = filter === 'unread'
    ? rooms.filter(r => r.unread > 0)
    : rooms

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0,1fr)', gap: 0, height: 'calc(100vh - 56px)', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>

      {/* ── 대화 목록 ── */}
      <div style={{ borderRight: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
          <input placeholder="매장 검색..." style={{ width: '100%', border: '0.5px solid #ddd', borderRadius: 8, padding: '7px 10px', fontSize: 12, background: '#fafafa' }} />
        </div>

        {/* 탭 필터 */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flex: 1, padding: '8px 0', fontSize: 12, cursor: 'pointer',
              border: 'none', background: 'transparent',
              color: filter === f ? '#185FA5' : '#aaa',
              borderBottom: `2px solid ${filter === f ? '#185FA5' : 'transparent'}`,
              fontWeight: filter === f ? 600 : 400,
            }}>
              {f === 'all' ? '전체' : '미확인'}
            </button>
          ))}
        </div>

        {/* 목록 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredRooms.map(room => {
            const slug = (room.brand as any)?.slug ?? 'redhot'
            const c = BRAND_COLORS[slug] ?? BRAND_COLORS.redhot
            const isActive = activeRoom?.id === room.id
            return (
              <div key={room.id} onClick={() => setActiveRoom(room)} style={{
                padding: '10px 14px', cursor: 'pointer',
                background: isActive ? '#EBF3FF' : 'transparent',
                borderBottom: '0.5px solid rgba(0,0,0,0.05)',
                transition: 'background 0.1s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>
                      {(room.store as any)?.name ?? room.name ?? '단체 채널'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 10, color: '#bbb' }}>{room.lastAt ?? ''}</span>
                    {room.unread > 0 && (
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E24B4A', display: 'inline-block' }} />
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {room.lastMsg ?? '대화를 시작하세요'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 채팅 창 ── */}
      {activeRoom ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* 헤더 */}
          <div style={{ padding: '12px 18px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#639922', display: 'inline-block' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {(activeRoom.store as any)?.name ?? activeRoom.name}
              </div>
              <div style={{ fontSize: 11, color: '#aaa' }}>
                {(activeRoom.brand as any)?.name} · 온라인
              </div>
            </div>
          </div>

          {/* 메시지 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, background: '#fafafa' }}>
            {messages.map((msg: any) => {
              const isMe = msg.sender?.role !== 'store_owner'
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: isMe ? '#EBF3FF' : '#FFF0EE',
                    color: isMe ? '#185FA5' : '#C04828',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600,
                  }}>
                    {isMe ? '본' : (msg.sender?.name?.[0] ?? '점')}
                  </div>
                  <div style={{ maxWidth: '75%' }}>
                    <div style={{
                      padding: '9px 13px', fontSize: 13, lineHeight: 1.55,
                      borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      background: isMe ? '#185FA5' : '#fff',
                      color: isMe ? '#fff' : '#1a1a1a',
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* 입력창 */}
          <div style={{ padding: '10px 14px', borderTop: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', gap: 8, alignItems: 'flex-end', background: '#fff' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="메시지 입력..."
              rows={1}
              style={{ flex: 1, border: '0.5px solid #ddd', borderRadius: 18, padding: '8px 14px', fontSize: 13, resize: 'none', fontFamily: 'inherit', maxHeight: 80 }}
            />
            <button onClick={sendMessage} disabled={!input.trim()} style={{
              width: 34, height: 34, borderRadius: '50%', border: 'none',
              background: input.trim() ? '#185FA5' : '#ddd', color: '#fff',
              fontSize: 15, cursor: input.trim() ? 'pointer' : 'default', flexShrink: 0,
            }}>↑</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 14 }}>
          왼쪽에서 대화를 선택하세요
        </div>
      )}
    </div>
  )
}
