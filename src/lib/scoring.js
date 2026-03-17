// ============================================================
// SUNSTICE AI HUB — Moteur de scoring (arbre de décision)
// ============================================================

// Q1 — Fréquence de la tâche
const FREQ_SCORE = {
  'Quotidien':      { roi: 95, urgency: 90 },
  'Hebdomadaire':   { roi: 75, urgency: 70 },
  'Mensuel':        { roi: 55, urgency: 50 },
  'Trimestriel':    { roi: 35, urgency: 30 },
  'Ponctuel':       { roi: 20, urgency: 15 },
}

// Q2 — Qualité / accessibilité des données
const DATA_SCORE = {
  'Structurées et accessibles':     { feasibility: 90, cost: 80 },
  'Partiellement structurées':      { feasibility: 60, cost: 55 },
  'Non structurées (PDF, emails…)': { feasibility: 35, cost: 30 },
  'Données inexistantes':           { feasibility: 10, cost: 10 },
}

// Q3 — Coût d'une erreur IA
const ERROR_SCORE = {
  'Faible — facilement corrigeable': { security: 95, feasibility_bonus: 10 },
  'Moyen — impact limité':           { security: 65, feasibility_bonus: 0  },
  'Élevé — conséquences critiques':  { security: 25, feasibility_bonus: -15 },
}

// Q4 — Périmètre / qui en bénéficie
const SCOPE_SCORE = {
  'Moi uniquement':          { roi_bonus: 0,  urgency_bonus: 5  },
  'Mon équipe Finance':      { roi_bonus: 15, urgency_bonus: 10 },
  'Plusieurs départements':  { roi_bonus: 25, urgency_bonus: 20 },
  "Toute l'entreprise":      { roi_bonus: 40, urgency_bonus: 30 },
}

// Q5 — Outil déjà existant utilisable
const TOOL_SCORE = {
  'Oui, Copilot M365 suffit':   { cost: 90, feasibility_bonus: 20, tool: 'Microsoft Copilot M365' },
  'Oui, Dust AI suffit':        { cost: 80, feasibility_bonus: 15, tool: 'Dust AI'                },
  'Partiellement — à compléter':{ cost: 55, feasibility_bonus: 5,  tool: 'Dust AI + dev léger'   },
  'Non — développement custom': { cost: 20, feasibility_bonus: 0,  tool: 'Développement sur mesure'},
}

const COST_LABEL = {
  range: (score) => {
    if (score >= 80) return '< 1 semaine / quasi gratuit'
    if (score >= 55) return '1–4 semaines / coût faible'
    if (score >= 30) return '1–3 mois / investissement moyen'
    return '3+ mois / investissement élevé'
  }
}

export function computeScores({ q_frequency, q_data_quality, q_error_cost, q_scope, q_existing_tool }) {
  const freq   = FREQ_SCORE[q_frequency]   || { roi: 30, urgency: 30 }
  const data   = DATA_SCORE[q_data_quality] || { feasibility: 30, cost: 30 }
  const err    = ERROR_SCORE[q_error_cost]  || { security: 50, feasibility_bonus: 0 }
  const scope  = SCOPE_SCORE[q_scope]       || { roi_bonus: 0, urgency_bonus: 0 }
  const tool   = TOOL_SCORE[q_existing_tool]|| { cost: 30, feasibility_bonus: 0, tool: 'À évaluer' }

  const score_roi       = Math.min(100, freq.roi + scope.roi_bonus)
  const score_feasibility = Math.min(100, Math.max(0, data.feasibility + err.feasibility_bonus + tool.feasibility_bonus))
  const score_security  = err.security
  const score_cost      = Math.round((data.cost + tool.cost) / 2)
  const score_urgency   = Math.min(100, freq.urgency + scope.urgency_bonus)

  const score_global = Math.round(
    score_roi * 0.30 +
    score_feasibility * 0.25 +
    score_security * 0.15 +
    score_cost * 0.15 +
    score_urgency * 0.15
  )

  const tool_recommendation = tool.tool
  const cost_estimate = COST_LABEL.range(score_cost)

  let verdict = 'À approfondir'
  if (score_global >= 75) verdict = 'Quick Win'
  else if (score_global >= 55) verdict = 'Fort potentiel'

  return {
    score_roi,
    score_feasibility,
    score_security,
    score_cost,
    score_urgency,
    score_global,
    tool_recommendation,
    cost_estimate,
    verdict,
  }
}
