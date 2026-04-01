import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

const navItems = [
  { href: '/hq',          label: '대시보드',      icon: '📊' },
  { href: '/hq/notices',  label: '공지 발송',     icon: '📢' },
  { href: '/hq/chat',     label: '채팅 관리',     icon: '💬' },
]

export default function HQLayout({ children }: { children: React.ReactNode }) {
  const session = getSession()

  // 로그인 페이지는 인증 체크 제외
  if (!session || session.role === 'store_owner') {
    // children이 로그인 페이지면 그냥 보여줌
    return <>{children}</>
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220, background: '#fff',
        borderRight: '0.5px solid rgba(0,0,0,0.08)',
        display: 'flex', flexDirection: 'column',
        padding: '20px 0', position: 'sticky',
        top: 0, height: '100vh', flexShrink: 0,
      }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>🍕 HQ</div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>통합 관리자</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', fontSize: 14, color: '#555', cursor: 'pointer',
                borderLeft: '2px solid transparent',
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
        <div style={{ padding: '12px 20px', borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 12, color: '#aaa' }}>본사 관리자</div>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '28px', background: '#f5f5f5', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
```

저장 후 자동 재배포 기다렸다가 다시 접속해보세요!
```
https://planet-fran.vercel.app/hq/login또 다시 이렇게 뜨네오후 12:38파일 존재 여부를 GitHub에서 확인하도록 제안했습니다파일 존재 여부를 GitHub에서 확인하도록 제안했습니다app/hq/login/page.tsx 파일이 GitHub에 제대로 저장이 안 된 것 같아요.
GitHub에서 확인해볼게요.

확인 방법
github.com/chokii4352/planet_franchisee 접속 → 프랜차이즈 플랫폼 폴더 → app 폴더 → hq 폴더 클릭
거기서 login 폴더가 보이나요?웅 있어오후 12:38그럼 login 폴더 안에 page.tsx 파일이 있는지 확인해주세요!
login 폴더 클릭 → page.tsx 파일이 있으면 클릭해서 내용이 제대로 들어가 있는지 스크린샷 보내주세요.'use client'
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
}더 보기오후 12:38파일 내용은 맞아요! 문제는 hq/layout.tsx가 로그인 페이지에 접근하기 전에 세션 체크를 해서 막는 거예요.
layout.tsx를 서버 컴포넌트에서 완전히 다른 방식으로 바꿔야 해요.

app/hq/layout.tsx 전체 교체
GitHub → 프랜차이즈 플랫폼/app/hq/layout.tsx → ✏️ → 전체 선택 후 아래로 교체
typescript'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/hq',         label: '대시보드',  icon: '📊' },
  { href: '/hq/notices', label: '공지 발송', icon: '📢' },
  { href: '/hq/chat',    label: '채팅 관리', icon: '💬' },
]

export default function HQLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // 로그인 페이지는 레이아웃 없이 그냥 표시
  if (pathname === '/hq/login') {
    return <>{children}</>
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220, background: '#fff',
        borderRight: '0.5px solid rgba(0,0,0,0.08)',
        display: 'flex', flexDirection: 'column',
        padding: '20px 0', position: 'sticky',
        top: 0, height: '100vh', flexShrink: 0,
      }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>🍕 HQ</div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>통합 관리자</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', fontSize: 14, color: '#555', cursor: 'pointer',
                borderLeft: '2px solid transparent',
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
        <div style={{ padding: '12px 20px', borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 12, color: '#aaa' }}>본사 관리자</div>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '28px', background: '#f5f5f5', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
