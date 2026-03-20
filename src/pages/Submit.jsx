import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SYSTEM_PROMPT = `You are an AI Champion assistant at Sunstice, a SaaS supply chain software company. Your role is to help Finance team members identify and evaluate AI use cases through a conversation in English.

You will guide the user through exactly 4 steps, asking questions one at a time. Be concise and professional. No emojis, no excessive politeness.

STEP 1 — CONTEXT & IPO
Ask the user to describe their repetitive task. Then map it to Input / Process / Output and ask them to confirm or correct.

STEP 2 — SECURITY & RISK
Ask 2 questions: is the data confidential or sensitive? What happens if the AI makes a mistake?

STEP 3 — ROI & IMPACT
Ask about frequency, time spent manually, and how many people are affected.

STEP 4 — TOOL & FEASIBILITY
Ask these 3 questions:
1. Are the data sources structured (Excel, ERP, database) or unstructured (PDF, emails, video, audio)?
2. Does the task involve mainly text, documents, or conversation — or does it require browsing, clicking, or interacting with software interfaces?
3. Does the task need real-time web search or up-to-date external information?

Then based on ALL answers, determine the tool using these rules:

DUST AI if: unstructured data (PDFs, emails, docs), document analysis, summarization, Q&A on internal knowledge, no need for real-time web or complex system interaction.

COPILOT M365 if: task lives inside Microsoft 365 (Word, Excel, Outlook, Teams, PowerPoint), meeting summaries, email drafting, Excel automation, document generation, data from SharePoint or OneDrive.

DUST AI + COPILOT M365 if: task involves both document analysis AND Microsoft 365 workflows.

CUSTOM DEVELOPMENT if: complex processing (APIs, ERP integration, multi-system automation), custom logic or calculations, real-time data, automated reporting pipelines not covered by Dust or Copilot.

NO-CODE (Zapier/Make) if: mainly connecting two existing tools and triggering actions automatically, no AI reasoning needed.

Always explain briefly WHY you recommend a specific tool.

FINAL REPORT — when you have enough info from all 4 steps, generate a JSON report in <REPORT> tags with exactly this structure:
{
  "title": "concise title",
  "description": "one sentence",
  "verdict": "Quick Win" or "Fort potentiel" or "A approfondir" or "Long-term Project",
  "score_global": 0-100,
  "score_roi": 0-100,
  "score_feasibility": 0-100,
  "score_security": 0-100,
  "score_cost": 0-100,
  "score_urgency": 0-100,
  "tool_recommendation": "Dust AI" or "Microsoft Copilot M365" or "Dust AI + Copilot M365" or "Custom Development" or "No-code (Zapier/Make)",
  "cost_estimate": "e.g. < 1 week / near zero cost",
  "ipo_input": "description",
  "ipo_process": "description",
  "ipo_output": "description",
  "critique": "3-4 sentences analysis in English",
  "next_steps": ["step1", "step2", "step3"]
}

SCORING RULES:
- score_roi: daily=90, weekly=70, monthly=50, quarterly=30, one-off=15. Add 20 if whole company, add 10 if multiple teams.
- score_feasibility: structured data=80, partial=55, unstructured=35. Add 15 if Copilot or Dust covers it. Subtract 20 if requires complex custom dev.
- score_security: low error cost=90, medium=60, high/critical=25.
- score_cost: Copilot/Dust=85, no-code=75, light custom=50, full custom=20.
- score_urgency: same base as ROI weighted by people affected.
- score_global: roi*0.30 + feasibility*0.25 + security*0.15 + cost*0.15 + urgency*0.15

RULES:
- Always respond in English
- Max 1-2 questions at a time
- No emojis
- Generate the report automatically when you have enough info`

const WELCOME = `Hi, I'm your AI Champion at Sunstice.

I'm here to help you evaluate your automation ideas — it takes about 5 minutes.

To get started: what's a task you do regularly that you'd love to hand off to AI?`

function parseReport(text) {
  const match = text.match(/<REPORT>([\s\S]*?)<\/REPORT>/)
  if (!match) return null
  try { return JSON.parse(match[1].trim()) } catch { return null }
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
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [author, setAuthor] = useState('')
  const [department, setDepartment] = useState('Finance')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...newMessages.map(m => ({
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

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const saveIdea = async () => {
    if (!report || !author.trim()) return
    setSaving(true)
    const { error } = await supabase.from('ideas').insert([{
      author: author || user,
      department,
      title: report.title,
      description: report.description,
      category: 'IA Use Case',
      q_frequency: 'Evaluated via chatbot',
      q_data_quality: 'Evaluated via chatbot',
      q_error_cost: 'Evaluated via chatbot',
      q_scope: 'Evaluated via chatbot',
      q_existing_tool: report.tool_recommendation,
      score_roi: report.score_roi,
      score_feasibility: report.score_feasibility,
      score_security: report.score_security,
      score_cost: report.score_cost,
      score_urgency: report.score_urgency,
      score_global: report.score_global,
      tool_recommendation: report.tool_recommendation,
      cost_estimate: report.cost_estimate,
      verdict: report.verdict,
    }])
    setSaving(false)
    if (!error) setSaved(true)
    else alert('Error while saving.')
  }

  const resetAll = () => {
    setMessages([{ role: 'assistant', content: WELCOME }])
    setReport(null); setSaved(false); setInput(''); setAuthor('')
  }

  const VSTYLE = {
    'Quick Win':         { bg: '#1A2E1A', color: '#7BC67E' },
    'Fort potentiel':    { bg: '#2A1F0D', color: '#D4A85A' },
    'A approfondir':     { bg: '#1E1E1E', color: '#888' },
    'À approfondir':     { bg: '#1E1E1E', color: '#888' },
    'Long-term Project': { bg: '#0D1A2E', color: '#6AABFF' },
  }

  return (
    <div style={s.wrap}>
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>

      <div style={s.chatBox}>
        <div style={s.msgs}>
          {messages.map((m, i) => (
            <div key={i} style={{ ...s.row, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'assistant' && <div style={s.avatar}>AI</div>}
              <div style={{ ...s.bubble, ...(m.role === 'user' ? s.bubbleUser : s.bubbleBot) }}
                dangerouslySetInnerHTML={{ __html: formatMessage(m.content) }} />
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
              onClick={sendMessage} disabled={!input.trim() || loading}>→</button>
          </div>
        )}
      </div>

      {report && (
        <div style={s.reportWrap}>
          <div style={s.rCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={s.rTitle}>{report.title}</div>
                <div style={s.rDesc}>{report.description}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={s.bigScore}>{report.score_global}<span style={{ fontSize: 16, color: '#666' }}>/100</span></div>
                <div style={{ ...s.vBadge, background: VSTYLE[report.verdict]?.bg || '#1E1E1E', color: VSTYLE[report.verdict]?.color || '#888' }}>{report.verdict}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
            {[['INPUT', report.ipo_input], ['PROCESS', report.ipo_process], ['OUTPUT', report.ipo_output]].map(([l, v]) => (
              <div key={l} style={s.rCard}>
                <div style={s.miniLabel}>{l}</div>
                <div style={{ fontSize: 12, color: '#CCC', lineHeight: 1.5 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={s.rCard}>
            {[['ROI', report.score_roi], ['Feasibility', report.score_feasibility], ['Security', report.score_security], ['Cost', report.score_cost], ['Urgency', report.score_urgency]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#666', width: 72, flexShrink: 0 }}>{l}</span>
                <div style={{ flex: 1, height: 4, background: '#2A2A2A', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: v + '%', background: v >= 70 ? '#D4A85A' : v >= 45 ? '#555' : '#E24B4A', borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#fff', width: 24, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={s.rCard}>
            <div style={s.miniLabel}>Analysis</div>
            <div style={{ fontSize: 13, color: '#AAA', lineHeight: 1.7 }}>{report.critique}</div>
          </div>

          <div style={s.rCard}>
            <div style={s.miniLabel}>Next steps</div>
            {report.next_steps?.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4A85A', flexShrink: 0, marginTop: 6 }} />
                <span style={{ fontSize: 13, color: '#AAA', lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[['Recommended tool', report.tool_recommendation], ['Estimate', report.cost_estimate]].map(([l, v]) => (
              <div key={l} style={s.rCard}>
                <div style={s.miniLabel}>{l}</div>
                <div style={{ fontSize: 13, color: '#D4A85A', fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>

          {!saved ? (
            <div style={s.rCard}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={s.miniLabel}>Your first name *</label>
                  <input style={s.inp} value={author} onChange={e => setAuthor(e.target.value)} placeholder="e.g. Marie" />
                </div>
                <div>
                  <label style={s.miniLabel}>Department</label>
                  <select style={s.inp} value={department} onChange={e => setDepartment(e.target.value)}>
                    {['Finance', 'Controlling', 'Accounting', 'Treasury', 'Other'].map(d => <option key={d}>{d}</option>)}
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
  inputRow: { display: 'flex', borderTop: '0.5px solid #2A2A2A' },
  textarea: { flex: 1, fontFamily: "'Inter',sans-serif", fontSize: 14, padding: '12px 16px', background: '#0D0D0D', border: 'none', color: '#fff', outline: 'none', resize: 'none', lineHeight: 1.5 },
  sendBtn: { width: 50, background: '#D4A85A', border: 'none', color: '#0D0D0D', fontSize: 20, fontWeight: 700, cursor: 'pointer' },
  reportWrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  rCard: { background: '#141414', border: '0.5px solid #2A2A2A', borderRadius: 10, padding: '1.25rem' },
  rTitle: { fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 4 },
  rDesc: { fontSize: 13, color: '#888', lineHeight: 1.5 },
  bigScore: { fontFamily: "'Syne',sans-serif", fontSize: 38, fontWeight: 700, color: '#D4A85A', lineHeight: 1 },
  vBadge: { fontSize: 11, fontWeight: 500, padding: '4px 12px', borderRadius: 20, display: 'inline-block', marginTop: 6 },
  miniLabel: { fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 },
  inp: { fontFamily: "'Inter',sans-serif", fontSize: 13, padding: '9px 12px', background: '#1E1E1E', border: '0.5px solid #333', borderRadius: 8, color: '#fff', width: '100%', appearance: 'none' },
  saveBtn: { width: '100%', fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 600, padding: 12, background: '#D4A85A', color: '#0D0D0D', border: 'none', borderRadius: 8, cursor: 'pointer' },
}
