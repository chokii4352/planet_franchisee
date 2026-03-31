import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import type { Notice } from '@/lib/types'

const TYPE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  general: { label: '일반',  color: 'var(--brand-primary-dark)', bg: 'var(--brand-primary-light)' },
  urgent:  { label: '긴급',  color: '#A32D2D', bg: '#FCEBEB' },
  doc:     { label: '공문',  color: '#27500A', bg: '#EAF3DE' },
  private: { label: '개별',  color: '#3C3489', bg: '#EEEDFE' },
}

export default async function StoreNoticesPage() {
  const session = getSession()!

  // 자신에게 해당하는 공지 조회
  const { data: notices } = await supabaseAdmin
    .from('notices')
    .select('*, notice_receipts!left(read_at, confirmed_at, user_id)')
    .not('sent_at', 'is', null)
    .or(
      `target_type.eq.all,` +
      `and(target_type.eq.brand,target_ids.cs.["${session.brand_id}"]),` +
      `and(target_type.eq.store,target_ids.cs.["${session.store_id}"])`
    )
    .order('sent_at', { ascending: false })

  // 자신의 영수증만 필터
  const enriched = (notices ?? []).map((n: any) => ({
    ...n,
    myReceipt: n.notice_receipts?.find((r: any) => r.user_id === session.user_id) ?? null,
  }))

  const unreadCount = enriched.filter(n => !n.myReceipt?.read_at).length

  return (
    <div>
      {/* 헤더 */}
      <div className="brand-bg" style={{ padding: '20px 20px 16px', color: '#fff' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>공지사항</h1>
        {unreadCount > 0 && (
          <p style={{ fontSize: 13, opacity: 0.85 }}>읽지 않은 공지 {unreadCount}건</p>
        )}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {enriched.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb', fontSize: 14 }}>
            공지사항이 없습니다
          </div>
        ) : enriched.map(notice => {
          const t = TYPE_LABEL[notice.type] ?? TYPE_LABEL.general
          const isRead = !!notice.myReceipt?.read_at
          const needsConfirm = notice.require_confirm && !notice.myReceipt?.confirmed_at

          return (
            <Link key={notice.id} href={`/store/notices/${notice.id}`}>
              <div className="card" style={{ opacity: isRead ? 0.75 : 1, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {!isRead && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand-primary)', flexShrink: 0 }} />
                  )}
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 4,
                    background: t.bg, color: t.color, fontWeight: 600,
                  }}>
                    {t.label}
                  </span>
                  {needsConfirm && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#FFF8E8', color: '#9B6A0A', fontWeight: 600 }}>
                      확인 필요
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{notice.title}</p>
                <p style={{ fontSize: 12, color: '#aaa' }}>
                  {new Date(notice.sent_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
