# Er. Forge

*"Others help you solve problems. Er. Forge ensures you stop creating the same ones."*

Er. Forge is an AI-powered engineering intelligence system. It connects to your LeetCode account, pulls your submissions, and uses AI to analyze each one — not just whether you got it right, but *why* you got it wrong. It scores you across 12 engineering concepts, finds your weakest areas, assigns you targeted problems to fix them, and generates a shareable growth portfolio that shows recruiters real skill progress, not just a problem count.



## 🛠️ Technologies

- Next.js 14 (App Router)
- TypeScript
- Node.js + Express
- PostgreSQL via Supabase
- Google OAuth + JWT (Passport.js)
- OpenRouter API (Llama / Gemini models)
- Tailwind CSS
- Chart.js
- GSAP



## ✨ Features

- Connects to your LeetCode account via session token — pulls your full submission history automatically
- AI analyzes every submission and identifies the actual root cause: missing mental model, wrong data structure choice, flawed approach — not just the fix
- Scores you across 12 concepts (Arrays, DP, Graphs, Trees, Sliding Window, Backtracking, and more) and updates your skill profile with every sync
- Assigns you specific LeetCode problems targeted at your weakest concept each week, with direct problem links
- Auto-detects when you've completed an assigned problem the next time you sync — no manual marking
- Growth timeline chart shows how each concept score has changed over time
- Public shareable report link — no login required — for sharing with recruiters as proof of real skill growth
- Manual paste fallback for users who can't connect their session cookie



## 🧠 The Problem Every Other Tool Pretends Doesn't Exist

Every grind tool out there tells you what to solve next. None of them tell you *why you keep failing the same type of problem*. Er. Forge is the first system I've built that closes that loop — you submit, it diagnoses, it assigns, you practice, it tracks. The growth report you can share at the end of it is backed by actual data, not a solved-count badge.



## 🔧 Process

The idea started from a real frustration: I was solving LeetCode problems for weeks and still fumbling the same class of problem in interviews. There was no system. Just random grinding. So I designed one from scratch — vision doc, requirements, system design, database schema, the whole thing — before writing a single line of code.

The backend was the hardest part architecturally. I had to figure out how to talk to LeetCode without an official API. The solution was using LeetCode's own GraphQL endpoint with a session cookie and CSRF token, which the user provides. From there, the backend pulls submission history, sends each one through an AI prompt that asks for a structured skill diagnosis, and updates the user's concept scores accordingly.

The AI analysis pipeline was its own challenge. The prompt had to be specific enough that the model returned consistent, structured output — skill tags, root cause, severity — every time. Getting that right took a lot of iteration. I ended up using OpenRouter to keep costs at zero during development.

The public report page is server-rendered and works without authentication so anyone can view it with just a link.



## 📚 What I Learned

- **LeetCode GraphQL integration** — how to reverse-engineer an unofficial API and authenticate with session cookies in a backend service
- **Prompt engineering for structured output** — how to write prompts that consistently return parseable, structured AI responses across hundreds of submissions
- **Next.js App Router** — the difference between server and client components, how SSR works in Next.js 14, and how to structure a real multi-page app with it
- **PostgreSQL schema design** — designing 7 related tables with proper indexing, foreign keys, and migration files
- **Google OAuth + JWT flow** — implementing a full auth system with Passport.js, token refresh, and protected route middleware
- **Building a real product from scratch** — going from a problem statement all the way to a deployed, working system with real architecture decisions at every step



## 🌱 Overall Growth

Er. Forge is the most complete system I've built solo. It's not just a feature or a demo — it has a real backend, a real database, real auth, real AI integration, and a real user flow. Building it taught me that the hardest part of any system isn't the code, it's making a hundred small decisions correctly and in the right order.



## 🚀 Running the Project
```bash
git clone https://github.com/SarthakKala/Er.-Forage.git
cd Er.-Forage

cd backend && npm install
# Fill in backend/.env: DATABASE_URL, SUPABASE_URL, SUPABASE_KEY,
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET,
# OPENROUTER_API_KEY, FRONTEND_URL
# Run DB migrations in Supabase SQL Editor (001 through 007)
npm run dev  # http://localhost:4000

cd ../frontend && npm install
# Create frontend/.env.local:
# NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm run dev  # http://localhost:3000
```


<!--
---

## 🎥 Video
-->

<!-- Attach your demo video here -->
