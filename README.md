# Er. Forge Monorepo

Sprint 1 foundation:

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

## Sprint 1 Auth Flow

1. Click **Continue with Google** on `/login`
2. Google callback redirects back to frontend with JWT
3. JWT is stored in localStorage
4. Click **Check /auth/me** to verify current profile

## Deployment Targets

- Frontend deploy: Vercel (root `frontend/`)
- Backend deploy: Render (root `backend/`, `render.yaml` included)
