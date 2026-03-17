# 🚀 Guide de déploiement — Finance AI Hub

## Ce que tu vas avoir
- Une app web avec login (Sunstice2026 / SunsticeAI)
- Formulaire guidé en 5 questions avec scoring automatique
- Dashboard avec filtres (Quick Wins, Copilot, Dust, sécurité, coût...)
- Données persistantes dans Supabase (base de données réelle)
- Déployé gratuitement sur Vercel

---

## Étape 1 — Créer la base de données Supabase (5 min)

1. Va sur https://supabase.com → créer un compte gratuit
2. Crée un nouveau projet (nom : "sunstice-ai", mdp quelconque)
3. Attends ~2 min que le projet se lance
4. Va dans **SQL Editor** (menu gauche)
5. Colle tout le contenu de `supabase_schema.sql` et clique **Run**
6. Va dans **Settings > API** et copie :
   - **Project URL** → c'est ton REACT_APP_SUPABASE_URL
   - **anon public key** → c'est ton REACT_APP_SUPABASE_ANON_KEY

---

## Étape 2 — Préparer le code (3 min)

1. Duplique le fichier `.env.example` en `.env.local`
2. Remplace les valeurs par tes vraies clés Supabase :
   ```
   REACT_APP_SUPABASE_URL=https://abcdefgh.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...
   ```
3. Mets le dossier `sunstice-ai` sur GitHub :
   - Crée un repo GitHub (https://github.com/new)
   - Upload le dossier ou utilise `git push`

---

## Étape 3 — Déployer sur Vercel (3 min)

1. Va sur https://vercel.com → créer un compte (gratuit)
2. Clique **Add New Project** → importe ton repo GitHub
3. Dans **Environment Variables**, ajoute :
   - `REACT_APP_SUPABASE_URL` = ton URL Supabase
   - `REACT_APP_SUPABASE_ANON_KEY` = ta clé Supabase
4. Clique **Deploy**
5. Dans ~2 min tu as une URL type `sunstice-ai.vercel.app` 🎉

---

## Connexion
- **Identifiant** : Sunstice2026
- **Mot de passe** : SunsticeAI

Pour ajouter d'autres comptes, modifie le tableau `CREDENTIALS` dans `src/pages/Login.jsx`.

---

## Structure des fichiers
```
sunstice-ai/
├── public/
│   └── index.html
├── src/
│   ├── lib/
│   │   ├── supabase.js      ← connexion base de données
│   │   └── scoring.js       ← arbre de décision + calcul scores
│   ├── pages/
│   │   ├── Login.jsx        ← page de connexion
│   │   ├── Submit.jsx       ← formulaire 5 questions
│   │   └── Dashboard.jsx    ← tableau de bord + filtres
│   ├── App.jsx              ← navigation principale
│   └── index.js             ← point d'entrée
├── supabase_schema.sql      ← à exécuter dans Supabase
├── .env.example             ← template variables d'environnement
└── package.json
```

---

## Fonctionnalités incluses

✅ Login avec identifiant / mot de passe
✅ Formulaire guidé 5 questions (arbre de décision)
✅ Scoring automatique : ROI, Faisabilité, Sécurité, Coût, Urgence
✅ Recommandation d'outil automatique (Copilot / Dust / Dev custom)
✅ Estimation coût / délai automatique
✅ Dashboard avec radar chart par idée
✅ Filtres : Quick Wins, Toute l'entreprise, Copilot, Dust, Sécurité, Coût
✅ Filtre par département
✅ Tri par score décroissant
✅ Données persistantes (Supabase)
✅ Déploiement gratuit (Vercel)
