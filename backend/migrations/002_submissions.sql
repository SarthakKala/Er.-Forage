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

