import { useState } from 'react'
import Login from './pages/Login'
import Submit from './pages/Submit'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('submit')

  if (!user) return <Login onLogin={setUser} />

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      <div style={styles.topbar}>
        <div style={styles.logoRow}>
          <img src="/logo.png" alt="Sunstice" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          <div>
            <div style={styles.logoText}>Sunstice</div>
            <div style={styles.logoSub}>AI Idea Rating Hub</div>
          </div>
        </div>
        <div style={styles.tabs}>
          <button style={{ ...styles.tabBtn, ...(tab === 'submit' ? styles.tabActive : {}) }} onClick={() => setTab('submit')}>
            Submit an idea
          </button>
          <button style={{ ...styles.tabBtn, ...(tab === 'dashboard' ? styles.tabActive : {}) }} onClick={() => setTab('dashboard')}>
            Dashboard
          </button>
        </div>
        <div style={styles.userRow}>
          {user.role === 'admin' && <span style={styles.adminBadge}>Admin</span>}
          <span style={styles.userLabel}>{user.id}</span>
          <button style={styles.logoutBtn} onClick={() => setUser(null)}>Sign out</button>
        </div>
      </div>
      <div>
        {tab === 'submit' ? <Submit user={user} /> : <Dashboard user={user} />}
      </div>
    </div>
  )
}

const styles = {
  topbar: { background: '#0D0D0D', borderBottom: '0.5px solid #1E1E1E', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10 },
  logoText: { fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.1 },
  logoSub: { fontSize: 10, color: '#555' },
  tabs: { display: 'flex', gap: 4 },
  tabBtn: { fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', background: 'transparent', color: '#666', transition: 'all 0.15s' },
  tabActive: { background: '#D4A85A', color: '#0D0D0D' },
  userRow: { display: 'flex', alignItems: 'center', gap: 8 },
  adminBadge: { fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#2A1F0D', color: '#D4A85A', textTransform: 'uppercase', letterSpacing: '0.05em' },
  userLabel: { fontSize: 12, color: '#555' },
  logoutBtn: { fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#555', background: 'none', border: '0.5px solid #2A2A2A', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' },
}
