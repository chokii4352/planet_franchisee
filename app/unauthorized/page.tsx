export default function UnauthorizedPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px 24px', textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>접근 권한이 없습니다</h2>
        <p style={{ fontSize: 14, color: '#888' }}>올바른 링크로 접속해주세요.</p>
        <a href="/hq/login" style={{ display: 'block', marginTop: 20, padding: '10px', background: '#185FA5', color: '#fff', borderRadius: 8, fontSize: 14, textDecoration: 'none' }}>관리자 로그인</a>
      </div>
    </div>
  )
}
