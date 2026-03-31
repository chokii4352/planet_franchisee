import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '프랜차이즈 통합 플랫폼',
  description: '본사-가맹점 실시간 소통 플랫폼',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
