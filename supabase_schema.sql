-- ============================================================
-- SUNSTICE AI HUB — Supabase Schema
-- Copiez-collez ceci dans Supabase > SQL Editor > Run
-- ============================================================

create table if not exists ideas (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  author text not null,
  department text not null,
  title text not null,
  description text,
  category text not null,
  -- Arbre de décision (5 questions)
  q_frequency text not null,
  q_data_quality text not null,
  q_error_cost text not null,
  q_scope text not null,
  q_existing_tool text not null,
  -- Scores calculés (0-100)
  score_roi integer not null,
  score_feasibility integer not null,
  score_security integer not null,
  score_cost integer not null,
  score_urgency integer not null,
  score_global integer not null,
  -- Recommandations générées
  tool_recommendation text not null,
  cost_estimate text not null,
  verdict text not null
);

-- Pas d'auth Supabase complexe : on gère un mot de passe simple côté app
-- Activer la lecture publique pour la démo
alter table ideas enable row level security;
create policy "Allow all" on ideas for all using (true) with check (true);
