'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/store',          icon: '🏠', label: '홈'     },
  { href: '/store/chat',     icon: '💬', label: '채팅'   },
  { href: '/store/notices',  icon: '📢', label: '공지'   },
]

export default function StoreNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      background: '#fff',
      borderTop: '0.5px solid rgba(0,0,0,0.08)',
      display: 'flex',
      zIndex: 100,
    }}>
      {NAV_ITEMS.map(item => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link key={item.href} href={item.href} style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px 0 10px',
              fontSize: 10,
              color: isActive ? 'var(--brand-primary)' : '#bbb',
              fontWeight: isActive ? 600 : 400,
              transition: 'color 0.1s',
              gap: 2,
            }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
