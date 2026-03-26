import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SYSTEM_PROMPT = `You are an AI Champion assistant at Sunstice. Your role is to help employees across all departments identify and evaluate AI automation use cases.

--- SUNSTICE CONTEXT ---
Company: Sunstice is a SaaS supply chain software company (PME, ~250 employees). The core product includes modules like Demand, Supply, Scheduling — helping clients (e.g. Total) optimize stock levels using AI, weather data, seasonal trends, etc.

Offices: Paris (HQ), Benelux, Birmingham (UK), DACH (x2), Iberia, Beijing, Shanghai, Camden (Australia/NZ), MENA, Singapore (APAC), Brazil, Austin (US).

Departments & headcount: Professional Services 52, R&D+Product 42, Customer Service 16, Sales 13, Finance 8, Marketing 8, HR 5, Cloud 6, IT 1. Total ~250.

Tech stack: Microsoft 365 (Teams, Outlook, Excel, PowerPoint, Power Automate, SharePoint). Tools: Salesforce, Jira, Sciforma, Cegid, Spendesk. Data lives in Excel, emails, PDFs, SharePoint/Drive.

AI tool decision: No AI tool has been purchased yet. The goal of this platform is to collect use cases company-wide and determine which single tool to buy (Copilot M365, Dust AI, n8n, or other). Evaluate each use case as if the tool doesn't exist yet.

Budget: Max ~€150,000/year total AI budget. Governance: AI Champions (1 per dept) propose ideas, validated by 3 managers.

Security: ISO 27001 certified on SaaS. Handles sensitive client data (large enterprise clients). GDPR applies. Data must not leave secure environments.

Languages: Primarily French and English, but global offices speak many languages.
--- END CONTEXT ---

You will guide the user through exactly 4 steps, asking questions one at a time. Be concise and professional. No emojis, no excessive politeness.

STEP 1 — CONTEXT & IPO
Ask the user to describe their repetitive task. Then map it to Input / Process / Output and ask them to confirm or correct.

STEP 2 — SECURITY & RISK
Ask 2 questions:
1. Does this task involve sensitive or confidential data (client data, financial records, personal data)?
2. What happens if the AI makes a mistake — what is the business impact?

STEP 3 — ROI & IMPACT
Ask:
1. How often is this task performed (daily / weekly / monthly / quarterly)?
2. How long does it take manually each time?
3. How many people at Sunstice are affected by this task?

STEP 4 — TOOL & FEASIBILITY
Ask:
1. Are the data sources structured (Excel, ERP, database) or unstructured (PDF, emails, video, audio)?
2. Does the task involve mainly text, documents, or conversation — or does it require interacting with software interfaces?
3. Does the task need real-time or frequently updated external information?

Then based on ALL answers and the Sunstice context, determine the tool:

DUST AI → best for: document Q&A, internal knowledge base, summarization of PDFs/emails, unstructured data analysis. Good fit for PS, Finance, HR, CS teams handling docs.

MICROSOFT COPILOT M365 → best for: tasks inside Teams, Outlook, Excel, PowerPoint, SharePoint. Meeting summaries, email drafting, Excel automation. Good fit since Sunstice already uses M365 fully.

DUST AI + COPILOT M365 → both needed: document analysis AND M365 workflow automation.

N8N / NO-CODE → best for: automating workflows between existing tools (Salesforce → Jira, Excel → email alerts, etc.). No AI reasoning needed, just automation logic. Cost-effective for Sunstice budget.

CUSTOM DEVELOPMENT → only if: complex ERP integration (Cegid, Sciforma, Salesforce APIs), multi-system pipelines, or real-time data processing. Most expensive — justify carefully given €150k budget.

Always explain briefly WHY you recommend a specific tool, referencing Sunstice's stack when relevant.

FINAL REPORT — when you have enough info from all 4 steps, generate a JSON report in <REPORT> tags:
{
  "title": "concise title",
  "description": "one sentence",
  "verdict": "Quick Win" or "Fort potentiel" or "A approfondir" or "Long-term Project",
  "score_global": 0,
  "score_roi": 0-100,
  "score_feasibility": 0-100,
  "score_security": 0-100,
  "score_cost": 0-100,
  "score_urgency": 0-100,
  "score_justification": {
    "roi": "1 sentence explaining this ROI score in Sunstice context",
    "feasibility": "1 sentence explaining this feasibility score",
    "security": "1 sentence explaining this security score given ISO27001 and client data sensitivity",
    "cost": "1 sentence explaining this cost score relative to the ~€150k budget",
    "urgency": "1 sentence explaining this urgency score given the number of people affected at Sunstice"
  },
  "tool_recommendation": "Dust AI" or "Microsoft Copilot M365" or "Dust AI + Copilot M365" or "n8n / No-code" or "Custom Development",
  "cost_estimate": "estimated effort and cost in Sunstice context",
  "ipo_input": "description",
  "ipo_process": "description",
  "ipo_output": "description",
  "critique": "3-4 sentences analysis referencing Sunstice context, departments affected, and tool fit",
  "next_steps": ["step1", "step2", "step3"]
}

IMPORTANT: Always set score_global to 0 — it will be recalculated automatically.

SCORING RULES — apply strictly:
- score_roi: daily=90, weekly=70, monthly=50, quarterly=30, one-off=15. Add 20 if affects whole company (all offices), add 10 if multiple departments. Cap at 100.
- score_feasibility: structured data=80, partial=55, unstructured=35. Add 15 if Copilot or Dust covers it directly (given M365 stack). Subtract 20 if requires complex ERP/API dev. Cap 0-100.
- score_security: low error cost=90, medium=60, high/critical=25. Apply extra caution: Sunstice is ISO27001, handles large enterprise client data — any risk of data leak or wrong output sent to clients = critical.
- score_cost: Copilot/Dust=85 (low cost, fits budget), n8n/no-code=75, light custom=50, full custom ERP integration=20 (expensive relative to €150k budget).
- score_urgency: base same as ROI, weighted by headcount affected. PS (52) or R&D (42) = high urgency. Finance (8) or IT (1) = lower urgency.

VERDICT rules:
- Quick Win: score_global >= 72 AND tool is Copilot or Dust or n8n
- Fort potentiel: score_global >= 55
- A approfondir: score_global >= 35
- Long-term Project: score_global < 35 OR requires full custom dev with high complexity

RULES:
- Always respond in English
- Max 1-2 questions at a time
- No emojis
- When moving to a new step, always announce it with the step name in bold: e.g. "**Security & Risk** — a couple of quick questions."
- When asking multiple questions, always number them: 1. ... 2. ... 3. ...
- Generate the report automatically when you have enough info`

const WELCOME = `Hi, I'm your AI Champion at Sunstice.

I'm here to help you evaluate your automation ideas — it takes about 5 minutes.

To get started: what's a task you do regularly that you'd love to hand off to AI?`

function computeGlobal(r) {
  return Math.round(
    (r.score_roi || 0) * 0.30 +
    (r.score_feasibility || 0) * 0.25 +
    (r.score_security || 0) * 0.15 +
    (r.score_cost || 0) * 0.15 +
    (r.score_urgency || 0) * 0.15
  )
}

function parseReport(text) {
  const match = text.match(/<REPORT>([\s\S]*?)<\/REPORT>/)
  if (!match) return null
  try {
    const r = JSON.parse(match[1].trim())
    r.score_global = computeGlobal(r)
    return r
  } catch { return null }
}

function cleanText(text) {
  return text.replace(/<REPORT>[\s\S]*?<\/REPORT>/, '').trim()
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

export default function Submit({ user }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [editReport, setEditReport] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [author, setAuthor] = useState('')
  const [department, setDepartment] = useState('Finance')
  const [editingMsgIdx, setEditingMsgIdx] = useState(null)
  const [editingMsgVal, setEditingMsgVal] = useState('')
  const [justifOpen, setJustifOpen] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (report) setEditReport({ ...report })
  }, [report])

  const sendMessage = async (overrideMessages) => {
    const msgs = overrideMessages || messages
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...msgs.map(m => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content
            }))
          ]
        })
      })
      const data = await res.json()
      const fullText = data.content?.[0]?.text || "Sorry, an error occurred."
      const parsedReport = parseReport(fullText)
      const displayText = cleanText(fullText)
      setMessages(prev => [...prev, { role: 'assistant', content: displayText }])
      if (parsedReport) setReport(parsedReport)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "An error occurred. Please try again." }])
    }
    setLoading(false)
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    sendMessage(newMessages)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const startEdit = (i, content) => { setEditingMsgIdx(i); setEditingMsgVal(content) }

  const confirmEdit = async (i) => {
    const trimmed = editingMsgVal.trim()
    if (!trimmed) return
    const truncated = [...messages.slice(0, i), { role: 'user', content: trimmed }]
    setMessages(truncated)
    setEditingMsgIdx(null); setEditingMsgVal('')
    setReport(null); setEditReport(null)
    await sendMessage(truncated)
  }

  const cancelEdit = () => { setEditingMsgIdx(null); setEditingMsgVal('') }

  const saveIdea = async () => {
    if (!editReport || !author.trim()) return
    setSaving(true)
    const { error } = await supabase.from('ideas').insert([{
      author: author || user?.id,
      department,
      title: editReport.title,
      description: editReport.description,
      category: 'IA Use Case',
      q_frequency: 'Evaluated via chatbot',
      q_data_quality: 'Evaluated via chatbot',
      q_error_cost: 'Evaluated via chatbot',
      q_scope: 'Evaluated via chatbot',
      q_existing_tool: editReport.tool_recommendation,
      score_roi: editReport.score_roi,
      score_feasibility: editReport.score_feasibility,
      score_security: editReport.score_security,
      score_cost: editReport.score_cost,
      score_urgency: editReport.score_urgency,
      score_global: editReport.score_global,
      tool_recommendation: editReport.tool_recommendation,
      cost_estimate: editReport.cost_estimate,
      verdict: editReport.verdict,
      ipo_input: editReport.ipo_input,
      ipo_process: editReport.ipo_process,
      ipo_output: editReport.ipo_output,
    }])
    setSaving(false)
    if (!error) setSaved(true)
    else alert('Error while saving.')
  }

  const resetAll = () => {
    setMessages([{ role: 'assistant', content: WELCOME }])
    setReport(null); setEditReport(null); setSaved(false)
    setInput(''); setAuthor(''); setEditingMsgIdx(null); setEditMode(false)
    setJustifOpen(false)
  }

  const VSTYLE = {
    'Quick Win':         { bg: '#1A2E1A', color: '#7BC67E' },
    'Fort potentiel':    { bg: '#2A1F0D', color: '#D4A85A' },
    'A approfondir':     { bg: '#1E1E1E', color: '#888' },
    'À approfondir':     { bg: '#1E1E1E', color: '#888' },
    'Long-term Project': { bg: '#0D1A2E', color: '#6AABFF' },
  }

  const updateField = (key, val) => setEditReport(r => ({ ...r, [key]: val }))

  return (
    <div style={s.wrap}>
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>

      <div style={s.chatBox}>
        <div style={s.msgs}>
          {messages.map((m, i) => (
            <div key={i} style={{ ...s.row, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'assistant' && <div style={s.avatar}>AI</div>}
              {m.role === 'user' && editingMsgIdx === i ? (
                <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <textarea style={s.editArea} value={editingMsgVal} onChange={e => setEditingMsgVal(e.target.value)} rows={2} autoFocus />
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button style={s.editCancel} onClick={cancelEdit}>Cancel</button>
                    <button style={s.editConfirm} onClick={() => confirmEdit(i)}>Confirm & resend →</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 3 }}>
                  <div style={{ ...s.bubble, ...(m.role === 'user' ? s.bubbleUser : s.bubbleBot) }}
                    dangerouslySetInnerHTML={{ __html: formatMessage(m.content) }} />
                  {m.role === 'user' && !report && (
                    <button style={s.editBtn} onClick={() => startEdit(i, m.content)}>edit</button>
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ ...s.row, justifyContent: 'flex-start' }}>
              <div style={s.avatar}>AI</div>
              <div style={{ ...s.bubble, ...s.bubbleBot, display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4A85A', display: 'inline-block', animation: `bounce 1.4s ${d}s infinite ease-in-out` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {!report && (
          <div style={s.inputRow}>
            <textarea style={s.textarea} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey} placeholder="Your message... (Enter to send)" rows={2} disabled={loading} />
            <button style={{ ...s.sendBtn, opacity: input.trim() && !loading ? 1 : 0.35 }}
              onClick={handleSend} disabled={!input.trim() || loading}>→</button>
          </div>
        )}
      </div>

      {editReport && (
        <div style={s.reportWrap}>
          <div style={s.rCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                {editMode
                  ? <input style={s.editTitle} value={editReport.title} onChange={e => updateField('title', e.target.value)} />
                  : <div style={s.rTitle}>{editReport.title}</div>}
                {editMode
                  ? <textarea style={s.editDesc} value={editReport.description} onChange={e => updateField('description', e.target.value)} rows={2} />
                  : <div style={s.rDesc}>{editReport.description}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={s.bigScore}>{editReport.score_global}<span style={{ fontSize: 16, color: '#666' }}>/100</span></div>
                <div style={{ ...s.vBadge, background: VSTYLE[editReport.verdict]?.bg || '#1E1E1E', color: VSTYLE[editReport.verdict]?.color || '#888' }}>{editReport.verdict}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
            {[['INPUT', 'ipo_input'], ['PROCESS', 'ipo_process'], ['OUTPUT', 'ipo_output']].map(([l, k]) => (
              <div key={l} style={s.rCard}>
                <div style={s.miniLabel}>{l}</div>
                {editMode
                  ? <textarea style={s.editIpo} value={editReport[k] || ''} onChange={e => updateField(k, e.target.value)} rows={3} />
                  : <div style={{ fontSize: 12, color: '#CCC', lineHeight: 1.5 }}>{editReport[k]}</div>}
              </div>
            ))}
          </div>

          <div style={s.rCard}>
            {[
              ['ROI', editReport.score_roi, editReport.score_justification?.roi],
              ['Feasibility', editReport.score_feasibility, editReport.score_justification?.feasibility],
              ['Security', editReport.score_security, editReport.score_justification?.security],
              ['Cost', editReport.score_cost, editReport.score_justification?.cost],
              ['Urgency', editReport.score_urgency, editReport.score_justification?.urgency],
            ].map(([l, v, justif]) => (
              <div key={l} style={{ marginBottom: justifOpen && justif ? 12 : 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#666', width: 72, flexShrink: 0 }}>{l}</span>
                  <div style={{ flex: 1, height: 4, background: '#2A2A2A', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: v + '%', background: v >= 70 ? '#D4A85A' : v >= 45 ? '#555' : '#E24B4A', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#fff', width: 24, textAlign: 'right' }}>{v}</span>
                </div>
                {justifOpen && justif && (
                  <div style={{ marginLeft: 82, marginTop: 4, fontSize: 11, color: '#666', lineHeight: 1.5, fontStyle: 'italic' }}>{justif}</div>
                )}
              </div>
            ))}
            {editReport.score_justification && (
              <button style={s.justifBtn} onClick={() => setJustifOpen(j => !j)}>
                {justifOpen ? 'Hide justification' : 'Why these scores?'}
              </button>
            )}
          </div>

          <div style={s.rCard}>
            <div style={s.miniLabel}>Analysis</div>
            <div style={{ fontSize: 13, color: '#AAA', lineHeight: 1.7 }}>{editReport.critique}</div>
          </div>

          <div style={s.rCard}>
            <div style={s.miniLabel}>Next steps</div>
            {editReport.next_steps?.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4A85A', flexShrink: 0, marginTop: 6 }} />
                <span style={{ fontSize: 13, color: '#AAA', lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[['Recommended tool', editReport.tool_recommendation], ['Estimate', editReport.cost_estimate]].map(([l, v]) => (
              <div key={l} style={s.rCard}>
                <div style={s.miniLabel}>{l}</div>
                <div style={{ fontSize: 13, color: '#D4A85A', fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>

          {!saved ? (
            <div style={s.rCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#555' }}>Review your report before saving.</div>
                <button style={s.editToggleBtn} onClick={() => setEditMode(m => !m)}>
                  {editMode ? 'Done editing' : 'Edit report'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={s.miniLabel}>Your first name *</label>
                  <input style={s.inp} value={author} onChange={e => setAuthor(e.target.value)} placeholder="e.g. Marie" />
                </div>
                <div>
                  <label style={s.miniLabel}>Department</label>
                  <select style={s.inp} value={department} onChange={e => setDepartment(e.target.value)}>
                    {['PS', 'R&D', 'Sales', 'Finance', 'Marketing', 'CS', 'CSX'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <button style={{ ...s.saveBtn, opacity: author.trim() ? 1 : 0.4 }} onClick={saveIdea} disabled={!author.trim() || saving}>
                {saving ? 'Saving...' : 'Save to dashboard →'}
              </button>
            </div>
          ) : (
            <div style={{ ...s.rCard, textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ width: 40, height: 40, background: '#1A2E1A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#7BC67E', fontSize: 18 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#fff', marginBottom: 8 }}>Idea saved successfully.</div>
              <button style={{ fontSize: 13, color: '#D4A85A', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} onClick={resetAll}>Evaluate another idea</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: { maxWidth: 700, margin: '0 auto', padding: '1.5rem', fontFamily: "'Inter',sans-serif" },
  chatBox: { background: '#141414', border: '0.5px solid #2A2A2A', borderRadius: 12, overflow: 'hidden', marginBottom: '1.25rem' },
  msgs: { padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 460, overflowY: 'auto' },
  row: { display: 'flex', alignItems: 'flex-start', gap: 8 },
  avatar: { width: 26, height: 26, borderRadius: '50%', background: '#2A1F0D', color: '#D4A85A', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  bubble: { maxWidth: '82%', padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.6 },
  bubbleBot: { background: '#1E1E1E', color: '#CCC', borderBottomLeftRadius: 4 },
  bubbleUser: { background: '#2A1F0D', color: '#D4A85A', borderBottomRightRadius: 4 },
  editBtn: { fontSize: 10, color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', textDecoration: 'underline' },
  editArea: { fontFamily: "'Inter',sans-serif", fontSize: 13, padding: '8px 12px', background: '#1E1E1E', border: '0.5px solid #D4A85A', borderRadius: 8, color: '#D4A85A', width: '100%', resize: 'vertical', outline: 'none' },
  editCancel: { fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#666', background: 'none', border: '0.5px solid #333', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' },
  editConfirm: { fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#0D0D0D', background: '#D4A85A', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 },
  inputRow: { display: 'flex', borderTop: '0.5px solid #2A2A2A' },
  textarea: { flex: 1, fontFamily: "'Inter',sans-serif", fontSize: 14, padding: '12px 16px', background: '#0D0D0D', border: 'none', color: '#fff', outline: 'none', resize: 'none', lineHeight: 1.5 },
  sendBtn: { width: 50, background: '#D4A85A', border: 'none', color: '#0D0D0D', fontSize: 20, fontWeight: 700, cursor: 'pointer' },
  reportWrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  rCard: { background: '#141414', border: '0.5px solid #2A2A2A', borderRadius: 10, padding: '1.25rem' },
  rTitle: { fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 4 },
  rDesc: { fontSize: 13, color: '#888', lineHeight: 1.5 },
  editTitle: { fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 700, color: '#fff', background: 'transparent', border: 'none', borderBottom: '0.5px solid #333', outline: 'none', width: '100%', marginBottom: 8, padding: '2px 0' },
  editDesc: { fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#888', background: 'transparent', border: 'none', borderBottom: '0.5px solid #2A2A2A', outline: 'none', width: '100%', resize: 'none', lineHeight: 1.5, padding: '2px 0' },
  editIpo: { fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#CCC', background: '#111', border: '0.5px solid #2A2A2A', borderRadius: 4, outline: 'none', width: '100%', resize: 'vertical', padding: '6px 8px', lineHeight: 1.5 },
  bigScore: { fontFamily: "'Syne',sans-serif", fontSize: 38, fontWeight: 700, color: '#D4A85A', lineHeight: 1 },
  vBadge: { fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 20, display: 'inline-block', marginTop: 6 },
  miniLabel: { fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 },
  justifBtn: { fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textDecoration: 'underline', marginTop: 4 },
  inp: { fontFamily: "'Inter',sans-serif", fontSize: 13, padding: '9px 12px', background: '#1E1E1E', border: '0.5px solid #333', borderRadius: 8, color: '#fff', width: '100%', appearance: 'none' },
  editToggleBtn: { fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#D4A85A', background: 'none', border: '0.5px solid #D4A85A33', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' },
  saveBtn: { width: '100%', fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 600, padding: 12, background: '#D4A85A', color: '#0D0D0D', border: 'none', borderRadius: 8, cursor: 'pointer' },
}
