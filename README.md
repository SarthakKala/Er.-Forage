# Er. Forge

> Others help you solve problems. Er. Forge ensures you stop creating the same ones.

## What is Er. Forge?
Er. Forge turns your coding submissions into a structured growth loop: it **analyzes** what went wrong, **scores** your underlying skills, and **assigns** targeted practice to close the exact gap. Then it tracks your progress over time and generates a **shareable growth report** you can use in interviews.

## Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind, Axios, Chart.js, GSAP |
| Backend | Node.js, Express, TypeScript |
| Database | Postgres (Supabase) |
| AI | OpenRouter (Gemini / other models) |
| Auth | Google OAuth (Passport) + JWT |

## Local Development

### Prerequisites
- Node.js 18+
- A Supabase account
- A Google Cloud OAuth app
- An OpenRouter API key

### Setup
1. Clone the repo

2. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

3. Set up environment variables
- Backend: copy `backend/.env.example` → `backend/.env` and fill in real values
- Frontend: copy `frontend/.env.example` → `frontend/.env.local`

4. Run database migrations
- Open Supabase → SQL Editor
- Run the migrations below **in order**.

5. Start development servers

```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000` and backend on `http://localhost:4000`.

### Seeding the demo account (Pitch Prep)

```bash
npx ts-node backend/scripts/seedDemo.ts
```

This creates a demo user (`demo@erforge.io`) with realistic seeded data and prints a ready-to-share public report URL.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string (Supabase) |
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_KEY` | yes | Supabase anon/service key used by server |
| `GOOGLE_CLIENT_ID` | yes | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | yes | Google OAuth client secret |
| `JWT_SECRET` | yes | JWT signing secret (7d expiry) |
| `OPENROUTER_API_KEY` | yes | OpenRouter API key |
| `FRONTEND_URL` | yes | Frontend origin for OAuth redirect + CORS |
| `PORT` | yes | Backend port (default 4000) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes | Backend API base (default `http://localhost:4000/api/v1`) |

## Database Migrations

Run these **in order** (Supabase SQL Editor). These migrations match the backend models and routes.

### 001_users.sql

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

### 002_submissions.sql

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

### 003_skill_scores.sql

```sql
CREATE TABLE IF NOT EXISTS skill_scores (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, concept)
);
```

### 004_skill_score_history.sql

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

### 005_assignments.sql

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

### 006_growth_reports.sql

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

### 007_platform_connections.sql

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

## Project Structure

```text
er_forage/
  backend/
    src/
      config/        # env loading
      jobs/          # cron jobs
      lib/           # helpers (db, leetcode utils, etc.)
      middleware/    # auth, error handling, rate limiting
      models/        # db queries
      routes/        # /api/v1 endpoints
      services/      # orchestration (analysis, assignments, portfolio snapshots)
    migrations/      # SQL migrations
    scripts/         # one-off scripts (demo seed)
  frontend/
    app/             # Next.js App Router pages
    components/      # UI / layout / charts
    lib/             # axios + types + utils
    public/          # static assets (favicon)
```

## Features
- **Closed-loop growth**: observe → diagnose → prescribe → verify (not just “answers”)
- **AI submission analysis**: root cause + missing mental model, not just a patch
- **Skill taxonomy scoring**: consistent 12-concept profile with clear strengths/gaps
- **Instructor loop assignments**: weekly targeted LeetCode problems (real links)
- **Auto-completion detection**: accepted submissions complete assignments automatically
- **Growth timeline**: weekly skill snapshots that visualize improvement
- **Shareable recruiter report**: public, no-login link that looks impressive

# Er. Forge Monorepo

Foundation:

- `frontend/` - Next.js 14 (App Router, TypeScript, TailwindCSS)
- `backend/` - Express + TypeScript with Google OAuth, JWT, and protected API routes

## Local Setup

1. Copy env files:
   - `backend/.env.example` -> `backend/.env`
   - `frontend/.env.example` -> `frontend/.env.local`
2. Run Migration 001 in Supabase SQL editor:
   - `backend/migrations/001_users.sql`
3. Start apps:
   - Backend: `npm run dev:backend`
   - Frontend: `npm run dev:frontend`
4. Open `http://localhost:3000/login`

