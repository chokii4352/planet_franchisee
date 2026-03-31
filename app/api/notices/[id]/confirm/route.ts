import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/notices/[id]/confirm
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabaseAdmin
    .from('notice_receipts')
    .upsert(
      {
        notice_id: params.id,
        user_id: session.user_id,
        confirmed_at: new Date().toISOString(),
        read_at: new Date().toISOString(),
      },
      { onConflict: 'notice_id,user_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
