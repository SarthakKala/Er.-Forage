import { db } from "../lib/db";

export type SkillScoreRow = {
  concept: string;
  score: number;
  last_updated: string;
};

export async function upsertSkillScore(params: {
  userId: string;
  concept: string;
  score: number;
}) {
  const query = `
    INSERT INTO skill_scores (user_id, concept, score, last_updated)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (user_id, concept)
    DO UPDATE SET
      score = EXCLUDED.score,
      last_updated = NOW()
  `;
  await db.query(query, [params.userId, params.concept, params.score]);
}

export async function insertSkillScoreHistory(params: {
  userId: string;
  concept: string;
  score: number;
}) {
  const query = `
    INSERT INTO skill_score_history (user_id, concept, score, recorded_at)
    VALUES ($1, $2, $3, NOW())
  `;
  await db.query(query, [params.userId, params.concept, params.score]);
}

export async function listSkillScoresByUser(userId: string): Promise<SkillScoreRow[]> {
  const query = `
    SELECT concept, score, last_updated
    FROM skill_scores
    WHERE user_id = $1
  `;
  const result = await db.query<SkillScoreRow>(query, [userId]);
  return result.rows;
}

export type SkillHistoryRow = {
  concept: string;
  score: number;
  recorded_at: string;
};

/** Weekly cron: copy every row in skill_scores into skill_score_history with a single timestamp. */
export async function copyAllSkillScoresToHistorySnapshot(): Promise<number> {
  const query = `
    INSERT INTO skill_score_history (user_id, concept, score, recorded_at)
    SELECT user_id, concept, score, NOW()
    FROM skill_scores
  `;
  const result = await db.query(query);
  return result.rowCount ?? 0;
}

export async function listSkillScoreHistoryForUser(userId: string): Promise<SkillHistoryRow[]> {
  const query = `
    SELECT concept, score, recorded_at
    FROM skill_score_history
    WHERE user_id = $1
    ORDER BY recorded_at ASC, concept ASC
  `;
  const result = await db.query<SkillHistoryRow>(query, [userId]);
  return result.rows;
}
