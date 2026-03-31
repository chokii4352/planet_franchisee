import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import ConfirmButton from './ConfirmButton'

interface Props { params: { id: string } }

export default async function NoticeDetailPage({ params }: Props) {
  const session = getSession()!

  const { data: notice } = await supabaseAdmin
    .from('notices')
    .select('*, author:users(name)')
    .eq('id', params.id)
    .single()

  if (!notice) redirect('/store/notices')

  // 읽음 처리 (서버에서 upsert)
  await supabaseAdmin.from('notice_receipts').upsert(
    { notice_id: params.id, user_id: session.user_id, read_at: new Date().toISOString() },
    { onConflict: 'notice_id,user_id', ignoreDuplicates: false }
  )

  // 내 영수증 조회
  const { data: receipt } = await supabaseAdmin
    .from('notice_receipts')
    .select('confirmed_at')
    .eq('notice_id', params.id)
    .eq('user_id', session.user_id)
    .single()

  const isConfirmed = !!receipt?.confirmed_at

  const TYPE_LABEL: Record<string, string> = {
    general: '일반', urgent: '긴급', doc: '공문', private: '개별'
  }

  return (
    <div>
      <div className="brand-bg" style={{ padding: '20px 20px 16px', color: '#fff' }}>
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
          {TYPE_LABEL[notice.type] ?? '일반'} 공지
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>{notice.title}</h1>
        <p style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
          {(notice.author as any)?.name ?? '본사'} ·{' '}
          {new Date(notice.sent_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div style={{ padding: 20 }}>
        <div className="card" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14, marginBottom: 16 }}>
          {notice.content}
        </div>

        {/* 확인 버튼 */}
        {notice.require_confirm && (
          <ConfirmButton
            noticeId={params.id}
            userId={session.user_id}
            isConfirmed={isConfirmed}
          />
        )}
      </div>
    </div>
  )
}
