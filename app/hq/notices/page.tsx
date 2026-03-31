'use client'
import { useState, useEffect } from 'react'
import type { Brand, Store, NoticeType } from '@/lib/types'

// 브랜드별 색상 맵
const BRAND_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  redhot: { bg: '#FFF0EE', text: '#C04828', border: '#C04828' },
  golden: { bg: '#FFF8E8', text: '#9B6A0A', border: '#9B6A0A' },
  arte:   { bg: '#EBF3FF', text: '#1A4EA8', border: '#2D6FD4' },
}

const NOTICE_TYPES: { value: NoticeType; label: string; color: string }[] = [
  { value: 'general', label: '일반 공지', color: '#2D6FD4' },
  { value: 'urgent',  label: '긴급 공지', color: '#E24B4A' },
  { value: 'doc',     label: '공문 발송', color: '#3B6D11' },
  { value: 'private', label: '개별 메시지', color: '#534AB7' },
]

export default function HQNoticesPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [storesByBrand, setStoresByBrand] = useState<Record<string, Store[]>>({})
  const [openBrands, setOpenBrands] = useState<Record<string, boolean>>({})
  const [selectedStores, setSelectedStores] = useState<Record<string, Set<string>>>({})
  const [noticeType, setNoticeType] = useState<NoticeType>('general')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [requireConfirm, setRequireConfirm] = useState(false)
  const [sendPush, setSendPush] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    // 브랜드 + 매장 목록 로드
    fetch('/api/brands?include_stores=true')
      .then(r => r.json())
      .then(({ brands, storesByBrand }) => {
        setBrands(brands)
        setStoresByBrand(storesByBrand)
        // 초기 상태
        const open: Record<string, boolean> = {}
        const sel: Record<string, Set<string>> = {}
        brands.forEach((b: Brand) => {
          open[b.id] = false
          sel[b.id] = new Set()
        })
        setOpenBrands(open)
        setSelectedStores(sel)
      })
  }, [])

  const totalSelected = Object.values(selectedStores).reduce((s, set) => s + set.size, 0)

  function toggleBrandOpen(brandId: string) {
    setOpenBrands(prev => ({ ...prev, [brandId]: !prev[brandId] }))
  }

  function toggleBrandAll(brandId: string) {
    const stores = storesByBrand[brandId] ?? []
    setSelectedStores(prev => {
      const cur = prev[brandId]
      const next = new Set(cur)
      if (next.size === stores.length) {
        next.clear()
      } else {
        stores.forEach(s => next.add(s.id))
      }
      return { ...prev, [brandId]: next }
    })
  }

  function toggleStore(brandId: string, storeId: string) {
    setSelectedStores(prev => {
      const next = new Set(prev[brandId])
      if (next.has(storeId)) next.delete(storeId)
      else next.add(storeId)
      return { ...prev, [brandId]: next }
    })
  }

  function removeStore(brandId: string, storeId: string) {
    toggleStore(brandId, storeId)
  }

  // 발송 대상 pills
  const pillList: { brandId: string; storeId: string; label: string }[] = []
  brands.forEach(brand => {
    const stores = storesByBrand[brand.id] ?? []
    selectedStores[brand.id]?.forEach(storeId => {
      const store = stores.find(s => s.id === storeId)
      if (store) pillList.push({ brandId: brand.id, storeId, label: `${brand.name} ${store.name}` })
    })
  })

  // 발송 대상 결정
  function getTargetType() {
    if (totalSelected === 0) return 'all'
    const allStores = Object.values(storesByBrand).flat()
    return totalSelected === allStores.length ? 'all' : 'store'
  }

  function getTargetIds(): string[] {
    return pillList.map(p => p.storeId)
  }

  async function handleSend() {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, content, type: noticeType,
          target_type: getTargetType(),
          target_ids: getTargetIds(),
          require_confirm: requireConfirm,
          send_push: sendPush,
          send_kakao: false,
        }),
      })
      if (!res.ok) throw new Error('발송 실패')
      alert(`${totalSelected || '전체'} 매장에 공지가 발송되었습니다.`)
      setTitle(''); setContent('')
    } catch (e) {
      alert('발송 중 오류가 발생했습니다.')
    }
    setSending(false)
  }

  const currentTypeColor = NOTICE_TYPES.find(t => t.value === noticeType)?.color ?? '#2D6FD4'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>공지 발송</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px minmax(0,1fr)', gap: 16, alignItems: 'start' }}>

        {/* ── 왼쪽: 대상 선택 트리 ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', fontWeight: 600, fontSize: 13 }}>
            발송 대상 선택
          </div>
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {brands.map(brand => {
              const stores = storesByBrand[brand.id] ?? []
              const sel = selectedStores[brand.id] ?? new Set()
              const c = BRAND_COLORS[brand.slug] ?? BRAND_COLORS.redhot
              const isAllSel = sel.size === stores.length && stores.length > 0
              const isPartSel = sel.size > 0 && sel.size < stores.length

              return (
                <div key={brand.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', cursor: 'pointer' }}>
                    {/* 캐럿 */}
                    <span
                      onClick={() => toggleBrandOpen(brand.id)}
                      style={{ fontSize: 10, color: '#aaa', width: 12, display: 'inline-block', transform: openBrands[brand.id] ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
                    >▶</span>
                    {/* 브랜드 체크박스 */}
                    <div
                      onClick={() => toggleBrandAll(brand.id)}
                      style={{
                        width: 15, height: 15, borderRadius: 3,
                        border: `1.5px solid ${c.border}`,
                        background: isAllSel || isPartSel ? c.bg : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, color: c.text, cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      {isAllSel ? '✓' : isPartSel ? '–' : ''}
                    </div>
                    <div
                      onClick={() => toggleBrandOpen(brand.id)}
                      style={{ flex: 1, fontSize: 13, fontWeight: 500, color: c.text, display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.border, display: 'inline-block' }} />
                      {brand.name}
                    </div>
                    <span style={{ fontSize: 11, color: '#bbb' }}>{sel.size}/{stores.length}</span>
                  </div>

                  {/* 매장 목록 */}
                  {openBrands[brand.id] && (
                    <div style={{ paddingLeft: 30, borderLeft: `1.5px solid rgba(0,0,0,0.08)`, marginLeft: 22 }}>
                      {stores.map(store => (
                        <div
                          key={store.id}
                          onClick={() => toggleStore(brand.id, store.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 10px', fontSize: 12, cursor: 'pointer',
                            color: sel.has(store.id) ? '#1a1a1a' : '#888',
                          }}
                        >
                          <div style={{
                            width: 13, height: 13, borderRadius: 3,
                            border: `1.5px solid ${sel.has(store.id) ? c.border : '#ddd'}`,
                            background: sel.has(store.id) ? c.bg : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, color: c.text, flexShrink: 0,
                          }}>
                            {sel.has(store.id) ? '✓' : ''}
                          </div>
                          {store.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{
            padding: '10px 14px',
            borderTop: '0.5px solid rgba(0,0,0,0.06)',
            fontSize: 12, color: '#888', background: '#fafafa',
          }}>
            <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{totalSelected}</span>개 매장 선택
            {totalSelected === 0 && ' (전체 발송)'}
          </div>
        </div>

        {/* ── 오른쪽: 작성 패널 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* 발송 대상 pills */}
          <div className="card">
            <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>발송 대상</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 32 }}>
              {pillList.length === 0 ? (
                <span style={{ fontSize: 13, color: '#bbb' }}>전체 브랜드 · 전체 매장</span>
              ) : pillList.map(p => {
                const c = BRAND_COLORS[brands.find(b => b.id === p.brandId)?.slug ?? ''] ?? BRAND_COLORS.redhot
                return (
                  <span key={p.storeId} style={{
                    fontSize: 12, padding: '3px 9px', borderRadius: 20,
                    background: c.bg, color: c.text, fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                  }}
                    onClick={() => removeStore(p.brandId, p.storeId)}
                  >
                    {p.label} <span style={{ opacity: 0.6, fontSize: 10 }}>✕</span>
                  </span>
                )
              })}
            </div>
          </div>

          {/* 공지 유형 */}
          <div className="card">
            <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>공지 유형</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {NOTICE_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setNoticeType(t.value)}
                  style={{
                    flex: 1, padding: '8px 4px', fontSize: 12, cursor: 'pointer',
                    border: `0.5px solid ${noticeType === t.value ? t.color : '#ddd'}`,
                    borderRadius: 8,
                    background: noticeType === t.value ? `${t.color}15` : 'transparent',
                    color: noticeType === t.value ? t.color : '#888',
                    fontWeight: noticeType === t.value ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div className="card">
            <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>제목</p>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="공지 제목을 입력하세요"
              style={{
                width: '100%', border: '0.5px solid #ddd', borderRadius: 8,
                padding: '9px 12px', fontSize: 14, color: '#1a1a1a',
              }}
            />
          </div>

          {/* 내용 */}
          <div className="card">
            <p style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>내용</p>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={`공지 내용을 입력하세요.\n\n개별 매장 발송 시 {점주명}, {매장명} 변수 사용 가능합니다.\n예) {점주명} 점주님, {매장명} 관련 안내드립니다.`}
              rows={6}
              style={{
                width: '100%', border: '0.5px solid #ddd', borderRadius: 8,
                padding: '9px 12px', fontSize: 14, resize: 'vertical',
                fontFamily: 'inherit', lineHeight: 1.6,
              }}
            />
          </div>

          {/* 옵션 */}
          <div className="card">
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: '앱 푸시 알림', value: sendPush, setter: setSendPush },
                { label: '수신 확인 요청', value: requireConfirm, setter: setRequireConfirm },
              ].map(opt => (
                <label key={opt.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={opt.value}
                    onChange={e => opt.setter(e.target.checked)}
                    style={{ width: 14, height: 14 }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* 발송 버튼 */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button style={{
              border: '0.5px solid #ddd', borderRadius: 8, padding: '9px 18px',
              background: 'transparent', fontSize: 14, cursor: 'pointer', color: '#555',
            }}>임시저장</button>
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                border: 'none', borderRadius: 8, padding: '9px 22px',
                background: currentTypeColor, color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                opacity: sending ? 0.6 : 1,
              }}
            >
              {sending ? '발송 중...' : `${totalSelected > 0 ? `${totalSelected}개 매장에` : '전체'} 발송`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
