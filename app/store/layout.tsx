import { redirect } from 'next/navigation'
import { getSession, buildBrandTheme } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import StoreNav from '@/components/ui/StoreNav'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const session = getSession()
  if (!session || session.role !== 'store_owner') redirect('/unauthorized')

  // 브랜드 정보 조회
  const { data: brand } = await supabaseAdmin
    .from('brands')
    .select('*')
    .eq('id', session.brand_id)
    .single()

  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('*')
    .eq('id', session.store_id)
    .single()

  const theme = brand
    ? buildBrandTheme(brand.primary_color, brand.name, brand.logo_url)
    : buildBrandTheme('#E8593C', '본사', null)

  return (
    <div style={{
      maxWidth: 480,
      margin: '0 auto',
      minHeight: '100vh',
      background: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* CSS 변수 동적 주입 */}
      <style>{`
        :root {
          --brand-primary: ${theme.primaryColor};
          --brand-primary-light: ${theme.primaryLight};
          --brand-primary-dark: ${theme.primaryDark};
        }
      `}</style>

      <main style={{ flex: 1, paddingBottom: 64 }}>
        {/* session, store, brand를 children에게 전달할 때는 Context 또는 props 활용 */}
        {children}
      </main>

      <StoreNav />
    </div>
  )
}
