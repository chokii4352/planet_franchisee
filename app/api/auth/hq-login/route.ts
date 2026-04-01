import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const adminPassword = process.env.HQ_ADMIN_PASSWORD

    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json({ error: '비밀번호 오류' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('role', 'hq_admin')
      .single()

    if (!user) {
      return NextResponse.json({ error: '관리자 계정 없음' }, { status: 404 })
    }

    const token = jwt.sign(
      {
        user_id: user.id,
        store_id: null,
        brand_id: null,
        role: 'hq_admin',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      },
      process.env.JWT_SECRET!
    )

    const response = NextResponse.json({ success: true })
    response.cookies.set('fp_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('로그인 오류:', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
