import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { computeScores } from '../lib/scoring'

const STEPS = [
  {
    key: 'q_frequency',
    label: '01 — Fréquence',
    question: 'À quelle fréquence effectuez-vous cette tâche ?',
    hint: 'Plus c\'est fréquent, plus le ROI d\'une automatisation est élevé.',
    options: ['Quotidien', 'Hebdomadaire', 'Mensuel', 'Trimestriel', 'Ponctuel']
  },
  {
    key: 'q_data_quality',
    label: '02 — Données',
    question: 'Comment sont les données utilisées pour cette tâche ?',
    hint: 'Des données structurées et accessibles = une implémentation IA beaucoup plus facile.',
    options: ['Structurées et accessibles', 'Partiellement structurées', 'Non structurées (PDF, emails…)', 'Données inexistantes']
  },
  {
    key: 'q_error_cost',
    label: '03 — Risque',
    question: 'Quel est le coût d\'une erreur si l\'IA se trompe ?',
    hint: 'Cela détermine le niveau de validation humaine nécessaire et donc la faisabilité.',
    options: ['Faible — facilement corrigeable', 'Moyen — impact limité', 'Élevé — conséquences critiques']
  },
  {
    key: 'q_scope',
    label: '04 — Périmètre',
    question: 'À qui ce cas d\'usage peut-il bénéficier ?',
    hint: 'Plus le périmètre est large, plus l\'impact stratégique et le ROI sont élevés.',
    options: ['Moi uniquement', 'Mon équipe Finance', 'Plusieurs départements', "Toute l'entreprise"]
  },
  {
    key: 'q_existing_tool',
    label: '05 — Outil',
    question: 'Un outil existant pourrait-il couvrir ce besoin ?',
    hint: 'Copilot M365 et Dust AI sont déjà disponibles chez Sunstice.',
    options: ['Oui, Copilot M365 suffit', 'Oui, Dust AI suffit', 'Partiellement — à compléter', 'Non — développement custom']
  }
]

const DEPARTMENTS = ['Finance', 'Contrôle de Gestion', 'Comptabilité', 'Trésorerie', 'Autre']
const CATEGORIES = ['Reporting', 'Comptabilité', 'Trésorerie', 'Contrats', 'Budget', 'RH / Temps', 'Transverse']

export default function Submit({ user }) {
  const [phase, setPhase] = useState('intro') // intro | questions | result
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ title: '', description: '', department: 'Finance', category: 'Reporting', author: '' })
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const currentStep = STEPS[step]
  const totalSteps = STEPS.length

  const selectOption = (key, val) => setAnswers(a => ({ ...a, [key]: val }))

  const canNextIntro = form.title.trim().length > 3 && form.author.trim().length > 0

  const startQuestions = () => { if (canNextIntro) setPhase('questions') }

  const nextStep = () => {
    if (!answers[currentStep.key]) return
    if (step < totalSteps - 1) { setStep(s => s + 1) }
    else {
      const scores = computeScores(answers)
      setResult(scores)
      setPhase('result')
    }
  }

  const prevStep = () => {
    if (step === 0) setPhase('intro')
    else setStep(s => s - 1)
  }

  const saveIdea = async () => {
    setSaving(true)
    const payload = { ...form, ...answers, ...result }
    const { error } = await supabase.from('ideas').insert([payload])
    setSaving(false)
    if (!error) setSaved(true)
    else alert('Erreur lors de la sauvegarde. Vérifie ta connexion Supabase.')
  }

  const reset = () => {
    setPhase('intro'); setStep(0); setForm({ title: '', description: '', department: 'Finance', category: 'Reporting', author: '' })
    setAnswers({}); setResult(null); setSaved(false)
  }

  const pct = phase === 'intro' ? 0 : phase === 'result' ? 100 : Math.round(((step) / totalSteps) * 100)

  return (
    <div style={s.wrap}>
      {/* Progress */}
      <div style={s.progressWrap}>
        <div style={s.progressMeta}>
          <span style={s.progLabel}>
            {phase === 'intro' ? 'Contexte' : phase === 'result' ? 'Résultat' : `Question ${step + 1} / ${totalSteps}`}
          </span>
          <span style={s.progPct}>{pct}%</span>
        </div>
        <div style={s.track}><div style={{ ...s.fill, width: pct + '%' }} /></div>
      </div>

      {/* INTRO */}
      {phase === 'intro' && (
        <div>
          <div style={s.title}>Partagez votre idée IA</div>
          <div style={s.sub}>Décrivez votre besoin, puis répondez à 5 questions pour obtenir un score automatique.</div>

          <div style={s.card}>
            <Field label="Votre prénom *">
              <input style={s.input} value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Ex : Marie" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Département">
                <Select options={DEPARTMENTS} value={form.department} onChange={v => setForm(f => ({ ...f, department: v }))} />
              </Field>
              <Field label="Catégorie">
                <Select options={CATEGORIES} value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
              </Field>
            </div>
            <Field label="Votre idée en une phrase *">
              <input style={s.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex : Automatiser la consolidation du reporting mensuel" />
            </Field>
            <Field label="Contexte / remarques (optionnel)">
              <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Outils actuels, contraintes, idée de solution..." />
            </Field>
          </div>

          <button style={{ ...s.btn, opacity: canNextIntro ? 1 : 0.4 }} onClick={startQuestions} disabled={!canNextIntro}>
            Commencer l'évaluation →
          </button>
        </div>
      )}

      {/* QUESTIONS */}
      {phase === 'questions' && (
        <div>
          <div style={s.card}>
            <div style={s.qLabel}>{currentStep.label}</div>
            <div style={s.qTitle}>{currentStep.question}</div>
            <div style={s.qHint}>{currentStep.hint}</div>
            <div style={s.optGrid}>
              {currentStep.options.map(opt => (
                <button
                  key={opt}
                  style={{ ...s.optBtn, ...(answers[currentStep.key] === opt ? s.optSelected : {}) }}
                  onClick={() => selectOption(currentStep.key, opt)}
                >{opt}</button>
              ))}
            </div>
          </div>
          <div style={s.navRow}>
            <button style={s.backBtn} onClick={prevStep}>← Retour</button>
            <button style={{ ...s.btn, opacity: answers[currentStep.key] ? 1 : 0.4, width: 'auto', padding: '10px 28px' }}
              onClick={nextStep} disabled={!answers[currentStep.key]}>
              {step === totalSteps - 1 ? 'Voir le score →' : 'Suivant →'}
            </button>
          </div>
        </div>
      )}

      {/* RESULT */}
      {phase === 'result' && result && (
        <div>
          <div style={s.card}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={s.globalScore}>{result.score_global}</div>
              <div style={s.globalLabel}>Score global / 100</div>
              <div style={{ ...s.verdictBadge, ...(result.verdict === 'Quick Win' ? s.badgeGreen : result.verdict === 'Fort potentiel' ? s.badgeAmber : s.badgeGray) }}>
                {result.verdict}
              </div>
            </div>

            <div style={s.scoresGrid}>
              {[
                { label: 'ROI', val: result.score_roi },
                { label: 'Faisabilité', val: result.score_feasibility },
                { label: 'Sécurité', val: result.score_security },
                { label: 'Coût', val: result.score_cost },
                { label: 'Urgence', val: result.score_urgency },
              ].map(({ label, val }) => (
                <div key={label} style={s.scoreItem}>
                  <div style={s.scoreBar}>
                    <div style={{ ...s.scoreFill, width: val + '%', background: val >= 70 ? '#D4A85A' : val >= 45 ? '#888' : '#E24B4A' }} />
                  </div>
                  <div style={s.scoreRow}>
                    <span style={s.scoreLbl}>{label}</span>
                    <span style={s.scoreVal}>{val}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={s.divider} />

            <div style={s.infoGrid}>
              <InfoBlock label="Outil recommandé" value={result.tool_recommendation} />
              <InfoBlock label="Estimation coût / délai" value={result.cost_estimate} />
            </div>
          </div>

          {!saved ? (
            <button style={s.btn} onClick={saveIdea} disabled={saving}>
              {saving ? 'Sauvegarde...' : 'Enregistrer cette idée →'}
            </button>
          ) : (
            <div style={s.successBox}>
              <div style={s.successIcon}>✓</div>
              <div style={s.successText}>Idée enregistrée avec succès !</div>
              <button style={s.linkBtn} onClick={reset}>Soumettre une autre idée</button>
            </div>
          )}
          <button style={s.backBtn2} onClick={() => { setPhase('questions'); setStep(totalSteps - 1) }}>← Modifier mes réponses</button>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function Select({ options, value, onChange }) {
  return (
    <select style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, padding: '10px 14px', background: '#1E1E1E', border: '0.5px solid #333', borderRadius: 8, color: '#fff', width: '100%', appearance: 'none' }}
      value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function InfoBlock({ label, value }) {
  return (
    <div style={{ background: '#1A1A1A', border: '0.5px solid #2A2A2A', borderRadius: 8, padding: '0.75rem 1rem' }}>
      <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#D4A85A', fontWeight: 500 }}>{value}</div>
    </div>
  )
}

const s = {
  wrap: { maxWidth: 640, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: "'Inter', sans-serif" },
  progressWrap: { marginBottom: '2rem' },
  progressMeta: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  progLabel: { fontSize: 12, color: '#666' },
  progPct: { fontSize: 12, color: '#D4A85A' },
  track: { height: 2, background: '#2A2A2A', borderRadius: 2 },
  fill: { height: '100%', background: '#D4A85A', borderRadius: 2, transition: 'width 0.4s ease' },
  title: { fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 },
  sub: { fontSize: 13, color: '#666', marginBottom: '1.5rem', lineHeight: 1.6 },
  card: { background: '#141414', border: '0.5px solid #2A2A2A', borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem' },
  input: { fontFamily: "'Inter',sans-serif", fontSize: 14, padding: '10px 14px', background: '#1E1E1E', border: '0.5px solid #333', borderRadius: 8, color: '#fff', width: '100%', outline: 'none' },
  btn: { width: '100%', fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 600, padding: 14, background: '#D4A85A', color: '#0D0D0D', border: 'none', borderRadius: 8, cursor: 'pointer' },
  qLabel: { fontSize: 11, fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 },
  qTitle: { fontSize: 17, fontWeight: 500, color: '#fff', marginBottom: 6, lineHeight: 1.4 },
  qHint: { fontSize: 13, color: '#666', marginBottom: '1.25rem', lineHeight: 1.5 },
  optGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  optBtn: { fontFamily: "'Inter',sans-serif", fontSize: 14, padding: '12px 16px', background: '#1E1E1E', border: '0.5px solid #333', borderRadius: 8, color: '#aaa', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' },
  optSelected: { background: '#2A1F0D', border: '0.5px solid #D4A85A', color: '#D4A85A' },
  navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#666', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  backBtn2: { fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#666', background: 'none', border: 'none', cursor: 'pointer', marginTop: 12, display: 'block' },
  globalScore: { fontFamily: "'Syne',sans-serif", fontSize: 56, fontWeight: 700, color: '#D4A85A', lineHeight: 1 },
  globalLabel: { fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 },
  verdictBadge: { display: 'inline-block', fontSize: 12, fontWeight: 500, padding: '4px 14px', borderRadius: 20, marginTop: 10 },
  badgeGreen: { background: '#1A2E1A', color: '#7BC67E' },
  badgeAmber: { background: '#2A1F0D', color: '#D4A85A' },
  badgeGray: { background: '#1E1E1E', color: '#888' },
  scoresGrid: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: '1rem' },
  scoreItem: {},
  scoreBar: { height: 4, background: '#2A2A2A', borderRadius: 2, marginBottom: 4, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: 2, transition: 'width 0.6s ease' },
  scoreRow: { display: 'flex', justifyContent: 'space-between' },
  scoreLbl: { fontSize: 12, color: '#888' },
  scoreVal: { fontSize: 12, fontWeight: 500, color: '#fff' },
  divider: { height: '0.5px', background: '#2A2A2A', margin: '1.25rem 0' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  successBox: { textAlign: 'center', background: '#141414', border: '0.5px solid #2A2A2A', borderRadius: 12, padding: '1.5rem', marginBottom: 12 },
  successIcon: { width: 44, height: 44, background: '#1A2E1A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#7BC67E', fontSize: 20 },
  successText: { fontSize: 15, fontWeight: 500, color: '#fff', marginBottom: 8 },
  linkBtn: { fontSize: 13, color: '#D4A85A', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' },
}
