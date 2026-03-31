'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Message } from '@/lib/types'

interface Props {
  roomId: string
  currentUserId: string
  brandColor: string
}

export default function StoreChatPage() {
  // 실제 사용 시 서버 컴포넌트에서 roomId, userId를 받아 이 컴포넌트에 전달
  return <ChatWindow roomId="" currentUserId="" brandColor="var(--brand-primary)" />
}

function ChatWindow({ roomId, currentUserId, brandColor }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 메시지 초기 로드
  useEffect(() => {
    if (!roomId) return
    supabase
      .from('messages')
      .select('*, sender:users(id, name, role)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data) setMessages(data as Message[])
      })
  }, [roomId])

  // 실시간 구독 (Supabase Realtime)
  useEffect(() => {
    if (!roomId) return
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  // 새 메시지 수신 시 스크롤 하단 이동
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 메시지 전송
  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending || !roomId) return
    setSending(true)
    const content = input.trim()
    setInput('')

    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      sender_id: currentUserId,
      content,
      msg_type: 'text',
    })

    if (error) {
      console.error('메시지 전송 실패:', error)
      setInput(content)  // 실패 시 복원
    }
    setSending(false)
  }, [input, sending, roomId, currentUserId])

  const quickMessages = [
    '정산 내역 확인 요청드립니다',
    '식자재 발주 관련 문의드립니다',
    '장비 고장 신고드립니다',
    '위생 점검 일정 확인 부탁드립니다',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* 헤더 */}
      <div style={{
        padding: '12px 16px',
        background: brandColor,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>🍕</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>본사 상담 채널</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>● 온라인</div>
        </div>
      </div>

      {/* 빠른 문의 버튼 */}
      <div style={{
        display: 'flex', gap: 8,
        padding: '8px 12px',
        overflowX: 'auto',
        borderBottom: '0.5px solid rgba(0,0,0,0.08)',
        background: '#fff',
      }}>
        {quickMessages.map(msg => (
          <button
            key={msg}
            onClick={() => setInput(msg)}
            style={{
              whiteSpace: 'nowrap',
              fontSize: 12,
              padding: '5px 12px',
              border: '0.5px solid #ddd',
              borderRadius: 20,
              background: 'transparent',
              color: '#555',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {msg}
          </button>
        ))}
      </div>

      {/* 메시지 목록 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: '#f5f5f5',
      }}>
        {messages.map(msg => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: isMe ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: 8,
            }}>
              {/* 아바타 */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: isMe ? 'var(--brand-primary-light)' : '#EBF3FF',
                color: isMe ? 'var(--brand-primary-dark)' : '#185FA5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, flexShrink: 0,
              }}>
                {isMe ? '나' : '본'}
              </div>

              {/* 말풍선 */}
              <div style={{ maxWidth: '75%' }}>
                {msg.msg_type === 'file' && msg.file_meta ? (
                  <div style={{
                    background: '#fff',
                    border: '0.5px solid #ddd',
                    borderRadius: 10,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 6,
                      background: '#EBF3FF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>📄</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{msg.file_meta.name}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>
                        {(msg.file_meta.size / 1024).toFixed(0)} KB · 탭하여 열기
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '9px 13px',
                    borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: isMe ? brandColor : '#fff',
                    color: isMe ? '#fff' : '#1a1a1a',
                    fontSize: 13,
                    lineHeight: 1.55,
                  }}>
                    {msg.content}
                  </div>
                )}
                <div style={{
                  fontSize: 11, color: '#bbb', marginTop: 3,
                  textAlign: isMe ? 'right' : 'left',
                }}>
                  {new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div style={{
        padding: '10px 12px',
        background: '#fff',
        borderTop: '0.5px solid rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder="본사에 메시지 보내기..."
          rows={1}
          style={{
            flex: 1,
            border: '0.5px solid #ddd',
            borderRadius: 18,
            padding: '8px 14px',
            fontSize: 13,
            resize: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.4,
            maxHeight: 80,
            overflowY: 'auto',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          style={{
            width: 34, height: 34,
            borderRadius: '50%',
            background: input.trim() ? brandColor : '#ddd',
            border: 'none',
            color: '#fff',
            fontSize: 15,
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
            flexShrink: 0,
          }}
        >↑</button>
      </div>
    </div>
  )
}
