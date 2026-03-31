'use server'
import { redirect } from 'next/navigation'
import { verifyMagicToken, setSessionCookie } from '@/lib/auth'

interface Props {
  params: { token: string }
}

// app/s/[token]/page.tsx
// 점주가 매직링크를 클릭하면 여기로 진입
export default async function MagicLinkPage({ params }: Props) {
  try {
    const session = await verifyMagicToken(params.token)
    setSessionCookie(params.token)

    // 역할에 따라 리다이렉트
    if (session.role === 'hq_admin' || session.role === 'brand_manager') {
      redirect('/hq')
    } else {
      redirect('/store')
    }
  } catch (err) {
    // 토큰 오류 페이지
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#f5f5f5',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '32px 24px',
          textAlign: 'center',
          maxWidth: 320,
          width: '100%',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            링크가 유효하지 않습니다
          </h2>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>
            링크가 만료되었거나 이미 사용된 링크입니다.
            <br />본사에 새 링크를 요청해주세요.
          </p>
        </div>
      </div>
    )
  }
}
