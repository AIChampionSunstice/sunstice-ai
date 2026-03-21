import { useState } from 'react'

const CREDENTIALS = [
  { id: 'Sunstice2026', password: 'SunsticeAI', role: 'user' },
  { id: 'SunsticeAdmin', password: 'Admin2026', role: 'admin' },
]

export default function Login({ onLogin }) {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const match = CREDENTIALS.find(c => c.id === id && c.password === pw)
    if (match) { onLogin({ id: match.id, role: match.role }); setError('') }
    else setError('Incorrect username or password.')
  }

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoMark}>S</div>
          <div>
            <div style={styles.logo}>Sunstice</div>
            <div style={styles.sub}>Finance AI Hub</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input style={styles.input} value={id} onChange={e => setId(e.target.value)} placeholder="Sunstice2026" autoComplete="username" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••••" autoComplete="current-password" />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.btn} type="submit">Sign in →</button>
        </form>
        <div style={styles.hint}>Contact your AI Champion to get access.</div>
      </div>
    </div>
  )
}

const styles = {
  bg: { minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: '1rem' },
  card: { background: '#141414', border: '0.5px solid #2A2A2A', borderRadius: 16, padding: '2.5rem 2rem', width: '100%', maxWidth: 380 },
  logoRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' },
  logoMark: { width: 40, height: 40, borderRadius: 10, background: '#D4A85A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D0D0D', flexShrink: 0 },
  logo: { fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.1 },
  sub: { fontSize: 12, color: '#555', marginTop: 2 },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input: { fontFamily: "'Inter', sans-serif", fontSize: 14, padding: '10px 14px', background: '#1E1E1E', border: '0.5px solid #333', borderRadius: 8, color: '#fff', outline: 'none' },
  error: { fontSize: 13, color: '#E24B4A', background: '#1A0D0D', padding: '8px 12px', borderRadius: 6 },
  btn: { fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, padding: '12px', background: '#D4A85A', color: '#0D0D0D', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 4 },
  hint: { fontSize: 11, color: '#444', textAlign: 'center', marginTop: '1.5rem' }
}
