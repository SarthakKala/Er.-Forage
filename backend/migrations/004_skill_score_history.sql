CREATE TABLE IF NOT EXISTS skill_score_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS skill_score_history_user_time_idx
  ON skill_score_history (user_id, recorded_at ASC);

