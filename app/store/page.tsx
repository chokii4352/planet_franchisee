export const dynamic = 'force-dynamic'

import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

export default async function StorePage() {
  const session = getSession()
  if (!session) return null

  const [{ data: store }, { data: brand }, { data: notices }] = await Promise.all([
    supabaseAdmin.from('stores').select('*').eq('id', session.store_id).single(),
    supabaseAdmin.from('brands').select('*').eq('id', session.brand_id).single(),
    supabaseAdmin
      .from('notices')
      .select('*, notice_receipts!left(read_at, confirmed_at)')
      .or(`target_type.eq.all,and(target_type.eq.brand,target_ids.cs.["${session.brand_id}"]),and(target_type.eq.store,target_ids.cs.["${session.store_id}"])`)
      .order('sent_at', { ascending: false })
      .limit(5),
  ])

  const unreadCount = notices?.filter((n: any) => !n.notice_receipts?.[0]?.read_at).length ?? 0

  return (
    <div>
      <div style={{ background: 'var(--brand-primary)', padding: '40px 20px 28px', textAlign: 'center', color: '#fff' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>🍕</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{brand?.name}</h1>
        <p style={{ fontSize: 14, opacity: 0.85 }}>{store?.name} 점주님, 안녕하세요</p>
      </div>

      <div style={{ padding: '16px' }}>
        {unreadCount > 0 && (
          <Link href="/store/notices">
            <div style={{ border: '1px solid var(--brand-primary)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, background: 'var(--brand-primary-light)', cursor: 'pointer' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-primary)', flexShrink: 0 }} />
              <span style={{ color: 'var(--brand-primary-dark)', fontSize: 13, fontWeight: 500 }}>읽지 않은 공지 {unreadCount}건이 있습니다</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#aaa' }}>→</span>
            </div>
          </Link>
        )}

        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.08)', padding: 16, marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>내 매장</p>
          <p style={{ fontSize: 16, fontWeight: 600 }}>{store?.name}</p>
          {store?.address && <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{store.address}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[{ label: '💬 본사 채팅', href: '/store/chat' }, { label: '📢 공지사항', href: '/store/notices' }].map(item => (
            <Link key={item.href} href={item.href}>
              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.08)', padding: '18px 8px', textAlign: 'center', cursor: 'pointer', fontWeight: 500, fontSize: 14 }}>{item.label}</div>
            </Link>
          ))}
        </div>

        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>최근 공지</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notices?.map((notice: any) => {
            const isRead = !!notice.notice_receipts?.[0]?.read_at
            return (
              <Link key={notice.id} href={`/store/notices/${notice.id}`}>
                <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid rgba(0,0,0,0.08)', padding: 16, opacity: isRead ? 0.7 : 1, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {!isRead && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-primary)', flexShrink: 0 }} />}
                    <span style={{ fontSize: 12, padding: '2px 7px', borderRadius: 4, background: notice.type === 'urgent' ? '#FCEBEB' : 'var(--brand-primary-light)', color: notice.type === 'urgent' ? '#A32D2D' : 'var(--brand-primary-dark)', fontWeight: 500 }}>
                      {notice.type === 'general' ? '일반' : notice.type === 'urgent' ? '긴급' : notice.type === 'doc' ? '공문' : '개별'}
                    </span>
                    <p style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notice.title}</p>
                  </div>
                  <p style={{ fontSize: 11, color: '#aaa' }}>{new Date(notice.sent_at || notice.created_at).toLocaleDateString('ko-KR')}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
