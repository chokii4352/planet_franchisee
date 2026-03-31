import { supabaseAdmin } from '@/lib/supabase'

export default async function HQDashboardPage() {
  const [
    { count: totalStores },
    { count: totalNotices },
    { data: recentNotices },
    { data: brands },
  ] = await Promise.all([
    supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('notices').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('notices').select('title, type, sent_at, target_type').order('sent_at', { ascending: false }).limit(5),
    supabaseAdmin.from('brands').select('id, name, slug, primary_color'),
  ])

  // 브랜드별 매장 수
  const brandCounts = await Promise.all(
    (brands ?? []).map(async brand => {
      const { count } = await supabaseAdmin
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', brand.id)
      return { ...brand, count: count ?? 0 }
    })
  )

  const stats = [
    { label: '전체 가맹점', value: totalStores ?? 0, color: '#185FA5' },
    { label: '발송된 공지',  value: totalNotices ?? 0, color: '#3B6D11' },
    { label: '활성 브랜드', value: brands?.length ?? 0, color: '#534AB7' },
  ]

  const TYPE_LABEL: Record<string, string> = {
    general: '일반', urgent: '긴급', doc: '공문', private: '개별'
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>대시보드</h1>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '0.5px solid rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* 브랜드별 현황 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '0.5px solid rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>브랜드별 매장 수</h2>
          {brandCounts.map(brand => (
            <div key={brand.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: brand.primary_color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, flex: 1 }}>{brand.name}</span>
              <div style={{ width: 80, height: 6, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((brand.count / (totalStores || 1)) * 100, 100)}%`, background: brand.primary_color, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, minWidth: 24, textAlign: 'right' }}>{brand.count}</span>
            </div>
          ))}
        </div>

        {/* 최근 공지 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '0.5px solid rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>최근 공지</h2>
          {(recentNotices ?? []).map((n: any) => (
            <div key={n.title + n.sent_at} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                fontSize: 11, padding: '2px 7px', borderRadius: 4, fontWeight: 600, flexShrink: 0,
                background: n.type === 'urgent' ? '#FCEBEB' : '#EBF3FF',
                color: n.type === 'urgent' ? '#A32D2D' : '#185FA5',
              }}>
                {TYPE_LABEL[n.type] ?? '일반'}
              </span>
              <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
              <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>
                {n.sent_at ? new Date(n.sent_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
