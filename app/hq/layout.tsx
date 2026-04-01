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
https://planet-fran.vercel.app/hq/login
