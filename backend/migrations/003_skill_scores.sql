CREATE TABLE IF NOT EXISTS skill_scores (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, concept)
);

