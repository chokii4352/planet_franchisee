'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HQLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/hq-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/hq')
    } else {
      setError('비밀번호가 올바르지 않습니다.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px 24px', maxWidth: 320, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🍕</div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>본사 관리자 로그인</h1>
        </div>
        <input
          type="password"
          placeholder="관리자 비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ width: '100%', border: '0.5px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
        />
        {error && <p style={{ color: '#E24B4A', fontSize: 13, marginBottom: 8 }}>{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading || !password}
          style={{ width: '100%', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </div>
    </div>
  )
}
