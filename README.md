<div align="center">

<br />

#  Er. Forge

### *Others help you solve problems. Er. Forge ensures you stop creating the same ones.*

<br />

You practice LeetCode. You get better at LeetCode.<br />
**Er. Forge makes you better at engineering.**


</div>

---

## The Problem

Most developers practice coding problems in isolation — grind, check the solution, move on. There's no system that tells you *why* you keep failing the same class of problem, *which* underlying skill is actually weak, or *what* to practice next.

Er. Forge is that system.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. SYNC          2. ANALYZE          3. SCORE                 │
│                                                                 │
│   Connect your  →  AI reads every  →  Maps each solve to       │
│   LeetCode         submission and      a 12-concept skill       │
│   account          finds the real      taxonomy and updates     │
│                    root cause,         your profile score       │
│                    not just the fix                             │
│                                                                 │
│   4. ASSIGN        5. VERIFY           6. REPORT                │
│                                                                 │
│   Get targeted  →  Solve them. We  →  Share a public           │
│   LeetCode         auto-detect         growth report           │
│   problems for     completions and     that shows real         │
│   your weakest     track progress      skill progress to       │
│   gaps             over time           recruiters              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## What You Get

**As a user:**

| Feature | What it actually does |
|---------|----------------------|
| **Skill Profile** | A live radar of your strengths across 12 concepts (Arrays, DP, Graphs, Trees, and more) — updated every time you sync |
| **AI Submission Analysis** | For every wrong answer or TLE, the AI explains the missing mental model, not just the corrected code |
| **Targeted Assignments** | Weekly LeetCode problems chosen specifically for your weakest concept — with real problem links |
| **Auto-Completion** | Sync again after solving an assignment and it's marked done automatically |
| **Growth Timeline** | A chart of your skill scores over time so you can see if you're actually improving |
| **Recruiter Report** | A shareable public link — no login required — that shows your growth story with data |

---

## The Growth Loop

```
        ┌──────────────────────────────────────┐
        │                                      │
        ▼                                      │
  [ Submit on LeetCode ]                       │
        │                                      │
        ▼                                      │
  [ Er. Forge syncs it ]                       │
        │                                      │
        ▼                                      │
  [ AI analyzes root cause ]                   │
        │                                      │
        ▼                                      │
  [ Skill score updated ]                      │
        │                                      │
        ▼                                      │
  [ Assignment generated for weakest gap ] ────┘
        │
        ▼
  [ Share growth report with recruiter ]
```

This loop runs every time you sync — the more you solve, the sharper your profile gets.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Chart.js, GSAP |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL via Supabase |
| **AI** | OpenRouter (Gemini / other models) |
| **Auth** | Google OAuth (Passport.js) + JWT |

---

## Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google Cloud](https://console.cloud.google.com) OAuth 2.0 app
- An [OpenRouter](https://openrouter.ai) API key

### 1. Install

```bash
git clone <your-repo-url> && cd er_forage

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure

```bash
cp backend/.env.example backend/.env       # fill in your values
cp frontend/.env.example frontend/.env.local
```

### 3. Run migrations

Open Supabase → SQL Editor and run `backend/migrations/001_users.sql` through `007_platform_connections.sql` in order.

### 4. Start

```bash
# Terminal 1
cd backend && npm run dev      # → http://localhost:4000

# Terminal 2
cd frontend && npm run dev     # → http://localhost:3000
```

Visit `http://localhost:3000`, sign in with Google, connect your LeetCode account, and sync.

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | Postgres connection string (Supabase) |
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_KEY` | yes | Supabase anon/service key |
| `GOOGLE_CLIENT_ID` | yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | yes | Google OAuth client secret |
| `JWT_SECRET` | yes | JWT signing secret (min 32 chars) |
| `OPENROUTER_API_KEY` | yes | OpenRouter API key |
| `FRONTEND_URL` | yes | Frontend origin for OAuth redirect and CORS |
| `PORT` | no | Backend port (default: `4000`) |

### Frontend — `frontend/.env.local`

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | no | Backend API base URL (default: `http://localhost:4000/api/v1`) |

---

## Database Migrations

Run in order in Supabase SQL Editor.

<details>
<summary><strong>001_users.sql</strong></summary>

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
</details>

<details>
<summary><strong>002_submissions.sql</strong></summary>

```sql
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  problem_id TEXT NOT NULL,
  problem_title TEXT NOT NULL,
  problem_tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  submitted_code TEXT,
  result TEXT NOT NULL CHECK (result IN ('accepted', 'wrong', 'tle', 'error')),
  error_message TEXT,
  ai_analysis TEXT,
  concept_tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  is_manual_paste BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL,
  UNIQUE (user_id, platform, problem_id, submitted_at)
);

CREATE INDEX IF NOT EXISTS submissions_user_time_idx
  ON submissions (user_id, submitted_at DESC);
```
</details>

<details>
<summary><strong>003_skill_scores.sql</strong></summary>

```sql
CREATE TABLE IF NOT EXISTS skill_scores (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, concept)
);
```
</details>

<details>
<summary><strong>004_skill_score_history.sql</strong></summary>

```sql
CREATE TABLE IF NOT EXISTS skill_score_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS skill_score_history_user_time_idx
  ON skill_score_history (user_id, recorded_at ASC);
```
</details>

<details>
<summary><strong>005_assignments.sql</strong></summary>

```sql
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  problem_title TEXT NOT NULL,
  platform_url TEXT NOT NULL,
  concept_target TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS assignments_user_status_idx
  ON assignments (user_id, status, assigned_at ASC);
```
</details>

<details>
<summary><strong>006_growth_reports.sql</strong></summary>

```sql
CREATE TABLE IF NOT EXISTS growth_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  snapshot_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  period TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS growth_reports_user_time_idx
  ON growth_reports (user_id, created_at DESC);
```
</details>

<details>
<summary><strong>007_platform_connections.sql</strong></summary>

```sql
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  leetcode_session TEXT,
  csrf_token TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform)
);

CREATE INDEX IF NOT EXISTS platform_connections_user_idx
  ON platform_connections (user_id, connected_at DESC);
```
</details>

---

## Project Structure

```
er_forage/
├── backend/
│   ├── src/
│   │   ├── adapters/       # Platform sync (LeetCode)
│   │   ├── ai/             # Prompt builder + response parser
│   │   ├── config/         # Environment + Passport setup
│   │   ├── jobs/           # Cron jobs (weekly skill snapshots)
│   │   ├── lib/            # DB, OpenRouter, Supabase, encryption
│   │   ├── middleware/      # Auth + error handling
│   │   ├── models/         # Database queries
│   │   ├── routes/         # /api/v1 endpoints
│   │   └── services/       # Orchestration (analysis, assignments, portfolio)
│   ├── migrations/         # SQL migration files
│   └── scripts/            # Demo seed script
└── frontend/
    ├── app/
    │   ├── (dashboard)/    # Skill profile, submissions, assignments, portfolio
    │   ├── login/          # Google OAuth entry point
    │   ├── onboarding/     # LeetCode connection setup
    │   └── report/[token]/ # Public shareable growth report
    ├── components/         # Charts, layout shell, UI primitives
    └── lib/                # Axios client, types, utilities
```

---

## Deployment

| | Service | Root directory |
|--|---------|---------------|
| **Frontend** | [Vercel](https://vercel.com) | `frontend/` |
| **Backend** | [Render](https://render.com) | `backend/` |

---

<div align="center">
*Built for engineers who want proof, not just practice.*
</div>
