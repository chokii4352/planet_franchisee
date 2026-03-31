'use client'
import { useState } from 'react'

interface Props {
  noticeId: string
  userId: string
  isConfirmed: boolean
}

export default function ConfirmButton({ noticeId, userId, isConfirmed: initial }: Props) {
  const [confirmed, setConfirmed] = useState(initial)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (confirmed || loading) return
    setLoading(true)
    await fetch(`/api/notices/${noticeId}/confirm`, { method: 'POST' })
    setConfirmed(true)
    setLoading(false)
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={confirmed || loading}
      className="brand-btn"
      style={{ opacity: confirmed ? 0.6 : 1 }}
    >
      {confirmed ? '✓ 확인 완료' : loading ? '처리 중...' : '공지 확인'}
    </button>
  )
}
