import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

const VERDICT_STYLE = {
  'Quick Win':      { bg: '#1A2E1A', color: '#7BC67E' },
  'Fort potentiel': { bg: '#2A1F0D', color: '#D4A85A' },
  'À approfondir':  { bg: '#1E1E1E', color: '#888' },
  'Long-term Project': { bg: '#0D1A2E', color: '#6AABFF' },
}

const FILTER_OPTS = [
  { key: 'all',           label: 'All' },
  { key: 'quick_win',     label: 'Quick Wins' },
  { key: 'company_wide',  label: 'Whole company' },
  { key: 'copilot',       label: 'Copilot M365' },
  { key: 'dust',          label: 'Dust AI' },
  { key: 'custom',        label: 'Dev custom' },
  { key: 'high_security', label: 'High security' },
  { key: 'low_cost',      label: 'Low cost' },
]

export default function Dashboard() {
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [deptFilter, setDeptFilter] = useState('All')
  const [sortField, setSortField] = useState('score_global')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => { fetchIdeas() }, [])

  async function fetchIdeas() {
    setLoading(true)
    const { data, error } = await supabase.from('ideas').select('*')
    if (!error) setIdeas(data || [])
    setLoading(false)
  }

  const departments = ['All', ...new Set(ideas.map(i => i.department))]

  const SORT_OPTS = [
    { field: 'score_global',      label: 'Global score' },
    { field: 'score_roi',         label: 'ROI' },
    { field: 'score_feasibility', label: 'Feasibility' },
    { field: 'score_security',    label: 'Security' },
    { field: 'score_cost',        label: 'Cost' },
    { field: 'score_urgency',     label: 'Urgency' },
    { field: 'created_at',        label: 'Date' },
  ]

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDir('desc') }
  }

  const filtered = ideas
    .filter(idea => {
      const deptOk = deptFilter === 'All' || idea.department === deptFilter
      if (!deptOk) return false
      switch (filter) {
        case 'quick_win':     return idea.verdict === 'Quick Win'
        case 'company_wide':  return idea.q_scope?.includes('entreprise') || idea.q_scope?.includes('company') || idea.q_scope?.includes('départements')
        case 'copilot':       return idea.tool_recommendation?.toLowerCase().includes('copilot')
        case 'dust':          return idea.tool_recommendation?.toLowerCase().includes('dust')
        case 'custom':        return idea.tool_recommendation?.toLowerCase().includes('custom') || idea.tool_recommendation?.toLowerCase().includes('mesure')
        case 'high_security': return idea.score_security >= 70
        case 'low_cost':      return idea.score_cost >= 70
        default:              return true
      }
    })
    .sort((a, b) => {
      const va = a[sortField] ?? 0
      const vb = b[sortField] ?? 0
      if (typeof va === 'string') return sortDir === 'desc' ? vb.localeCompare(va) : va.localeCompare(vb)
      return sortDir === 'desc' ? vb - va : va - vb
    })

  const stats = {
    total: ideas.length,
    quickWins: ideas.filter(i => i.verdict === 'Quick Win').length,
    avgScore: ideas.length ? Math.round(ideas.reduce((a, b) => a + b.score_global, 0) / ideas.length) : 0,
    copilot: ideas.filter(i => i.tool_recommendation?.toLowerCase().includes('copilot')).length,
    dust: ideas.filter(i => i.tool_recommendation?.toLowerCase().includes('dust')).length,
  }

  const catData = Object.entries(
    ideas.reduce((acc, i) => { acc[i.category] = (acc[i.category] || 0) + 1; return acc }, {})
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6)

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.title}>Dashboard</div>
        <button style={s.refreshBtn} onClick={fetchIdeas}>↻ Refresh</button>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        <StatCard val={stats.total} label="Ideas" />
        <StatCard val={stats.quickWins} label="Quick Wins" accent />
        <StatCard val={stats.avgScore} label="Avg score" />
        <StatCard val={stats.copilot} label="Copilot" />
        <StatCard val={stats.dust} label="Dust AI" />
      </div>

      {/* Chart */}
      {catData.length > 0 && (
        <div style={s.chartCard}>
          <div style={s.sectionLabel}>Ideas by category</div>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: '#888', fontFamily: 'Inter' }} />
                <Tooltip contentStyle={{ background: '#1E1E1E', border: '0.5px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {catData.map((_, i) => <Cell key={i} fill={i === 0 ? '#D4A85A' : '#2A2A2A'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={s.filterRow}>
        {FILTER_OPTS.map(f => (
          <button key={f.key} style={{ ...s.filterChip, ...(filter === f.key ? s.filterActive : {}) }} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Dept filter */}
      <div style={s.deptRow}>
        {departments.map(d => (
          <button key={d} style={{ ...s.deptChip, ...(deptFilter === d ? s.deptActive : {}) }} onClick={() => setDeptFilter(d)}>
            {d}
          </button>
        ))}
      </div>

      {/* Sort bar */}
      <div style={s.sortRow}>
        <span style={s.sortLabel}>Sort by</span>
        {SORT_OPTS.map(o => (
          <button key={o.field} style={{ ...s.sortChip, ...(sortField === o.field ? s.sortActive : {}) }} onClick={() => toggleSort(o.field)}>
            {o.label} {sortField === o.field ? (sortDir === 'desc' ? '↓' : '↑') : ''}
          </button>
        ))}
      </div>

      {/* Ideas list */}
      {loading ? (
        <div style={s.empty}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>No ideas in this category yet.</div>
      ) : (
        <div style={s.list}>
          {filtered.map(idea => (
            <div key={idea.id} style={s.ideaCard} onClick={() => setSelected(selected?.id === idea.id ? null : idea)}>
              <div style={s.ideaTop}>
                <div style={{ flex: 1 }}>
                  <div style={s.ideaTitle}>{idea.title}</div>
                  <div style={s.ideaMeta}>
                    <span style={s.pill}>{idea.category}</span>
                    <span style={s.pill}>{idea.department}</span>
                    <span style={{ ...s.pill, ...getToolStyle(idea.tool_recommendation) }}>{idea.tool_recommendation}</span>
                  </div>
                </div>
                <div style={s.right}>
                  <div style={s.scoreBig}>{idea.score_global}</div>
                  <div style={{ ...s.verdictBadge, background: VERDICT_STYLE[idea.verdict]?.bg || '#1E1E1E', color: VERDICT_STYLE[idea.verdict]?.color || '#888' }}>
                    {idea.verdict}
                  </div>
                </div>
              </div>

              {/* Mini scores inline */}
              <div style={s.miniScores}>
                {[['ROI', idea.score_roi], ['Feasibility', idea.score_feasibility], ['Security', idea.score_security], ['Cost', idea.score_cost], ['Urgency', idea.score_urgency]].map(([l, v]) => (
                  <div key={l} style={s.miniScore}>
                    <div style={s.miniScoreLabel}>{l}</div>
                    <div style={{ ...s.miniScoreBar }}>
                      <div style={{ width: v + '%', height: '100%', background: v >= 70 ? '#D4A85A' : v >= 45 ? '#444' : '#E24B4A', borderRadius: 2 }} />
                    </div>
                    <div style={s.miniScoreVal}>{v}</div>
                  </div>
                ))}
              </div>

              {selected?.id === idea.id && (
                <div style={s.detail}>
                  <div style={s.divider} />
                  {idea.description && <div style={s.desc}>{idea.description}</div>}
                  <div style={s.detailGrid}>
                    <div style={{ height: 180 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={[
                          { subject: 'ROI', val: idea.score_roi },
                          { subject: 'Feasibility', val: idea.score_feasibility },
                          { subject: 'Security', val: idea.score_security },
                          { subject: 'Cost', val: idea.score_cost },
                          { subject: 'Urgency', val: idea.score_urgency },
                        ]}>
                          <PolarGrid stroke="#2A2A2A" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#666', fontFamily: 'Inter' }} />
                          <Radar dataKey="val" stroke="#D4A85A" fill="#D4A85A" fillOpacity={0.15} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={s.detailInfo}>
                      <div style={s.infoBlock}>
                        <div style={s.infoLbl}>Recommended tool</div>
                        <div style={s.infoVal}>{idea.tool_recommendation}</div>
                      </div>
                      <div style={s.infoBlock}>
                        <div style={s.infoLbl}>Estimate</div>
                        <div style={s.infoVal}>{idea.cost_estimate}</div>
                      </div>
                      <div style={s.infoBlock}>
                        <div style={s.infoLbl}>Submitted by</div>
                        <div style={s.infoVal}>{idea.author} — {idea.department}</div>
                      </div>
                      <div style={s.infoBlock}>
                        <div style={s.infoLbl}>Verdict</div>
                        <div style={{ ...s.infoVal, color: VERDICT_STYLE[idea.verdict]?.color || '#888' }}>{idea.verdict}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getToolStyle(tool) {
  if (!tool) return {}
  const t = tool.toLowerCase()
  if (t.includes('copilot')) return { background: '#0D1A2E', color: '#6AABFF' }
  if (t.includes('dust'))    return { background: '#1A2E1A', color: '#7BC67E' }
  if (t.includes('custom') || t.includes('mesure')) return { background: '#2A1F0D', color: '#D4A85A' }
  return {}
}

function StatCard({ val, label, accent }) {
  return (
    <div style={{ background: '#141414', border: `0.5px solid ${accent ? '#D4A85A33' : '#2A2A2A'}`, borderRadius: 10, padding: '1rem', textAlign: 'center', flex: 1, minWidth: 80 }}>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 700, color: accent ? '#D4A85A' : '#fff' }}>{val}</div>
      <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
    </div>
  )
}

const s = {
  wrap: { maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: "'Inter', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, color: '#fff' },
  refreshBtn: { fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#666', background: 'none', border: '0.5px solid #333', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' },
  statsRow: { display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' },
  chartCard: { background: '#141414', border: '0.5px solid #2A2A2A', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' },
  sectionLabel: { fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 },
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  filterChip: { fontFamily: "'Inter',sans-serif", fontSize: 12, padding: '5px 12px', borderRadius: 20, border: '0.5px solid #333', background: 'transparent', color: '#666', cursor: 'pointer', transition: 'all 0.15s' },
  filterActive: { background: '#D4A85A', borderColor: '#D4A85A', color: '#0D0D0D' },
  deptRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  deptChip: { fontFamily: "'Inter',sans-serif", fontSize: 11, padding: '4px 10px', borderRadius: 20, border: '0.5px solid #2A2A2A', background: 'transparent', color: '#555', cursor: 'pointer' },
  deptActive: { border: '0.5px solid #555', color: '#fff' },
  sortRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' },
  sortLabel: { fontSize: 11, color: '#555', marginRight: 4 },
  sortChip: { fontFamily: "'Inter',sans-serif", fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '0.5px solid #2A2A2A', background: 'transparent', color: '#555', cursor: 'pointer', transition: 'all 0.15s' },
  sortActive: { border: '0.5px solid #D4A85A', color: '#D4A85A' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  ideaCard: { background: '#141414', border: '0.5px solid #2A2A2A', borderRadius: 12, padding: '1.25rem', cursor: 'pointer', transition: 'border-color 0.15s' },
  ideaTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  ideaTitle: { fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8, lineHeight: 1.3 },
  ideaMeta: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  pill: { fontSize: 11, color: '#666', background: '#1E1E1E', padding: '3px 9px', borderRadius: 20 },
  right: { textAlign: 'right', flexShrink: 0 },
  scoreBig: { fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 700, color: '#D4A85A', lineHeight: 1 },
  verdictBadge: { fontSize: 10, fontWeight: 500, padding: '3px 10px', borderRadius: 20, marginTop: 4, display: 'inline-block' },
  miniScores: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  miniScore: { display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 100 },
  miniScoreLabel: { fontSize: 10, color: '#555', width: 60, flexShrink: 0 },
  miniScoreBar: { flex: 1, height: 3, background: '#2A2A2A', borderRadius: 2, overflow: 'hidden' },
  miniScoreVal: { fontSize: 10, color: '#888', width: 20, textAlign: 'right' },
  detail: { marginTop: '1rem' },
  divider: { height: '0.5px', background: '#2A2A2A', marginBottom: '1rem' },
  desc: { fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: '1rem' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  detailInfo: { display: 'flex', flexDirection: 'column', gap: 8 },
  infoBlock: { background: '#1A1A1A', border: '0.5px solid #2A2A2A', borderRadius: 6, padding: '8px 10px' },
  infoLbl: { fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 },
  infoVal: { fontSize: 12, color: '#D4A85A', fontWeight: 500 },
  empty: { textAlign: 'center', color: '#555', fontSize: 14, padding: '3rem', background: '#141414', borderRadius: 12, border: '0.5px dashed #2A2A2A' },
}
