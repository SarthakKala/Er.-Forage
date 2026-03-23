import { db } from "../lib/db";

export type SubmissionRow = {
  id: string;
  user_id: string;
  platform: string;
  problem_id: string;
  problem_title: string;
  problem_tags: string[];
  difficulty: "easy" | "medium" | "hard";
  submitted_code: string | null;
  result: "accepted" | "wrong" | "tle" | "error";
  error_message: string | null;
  ai_analysis: string | null;
  concept_tags: string[];
  is_manual_paste: boolean;
  submitted_at: string;
};

export type SubmissionDraft = {
  platform: "leetcode";
  problem_id: string;
  problem_title: string;
  problem_tags: string[];
  difficulty: "easy" | "medium" | "hard";
  submitted_code: string | null;
  result: "accepted" | "wrong" | "tle" | "error";
  error_message: string | null;
  submitted_at: string;
};

export async function insertSubmissions(params: {
  userId: string;
  submissions: SubmissionDraft[];
}): Promise<{ insertedCount: number; totalAttempted: number }> {
  const { userId, submissions } = params;
  const client = await db.connect();
  let insertedCount = 0;

  const query = `
    INSERT INTO submissions (
      user_id,
      platform,
      problem_id,
      problem_title,
      problem_tags,
      difficulty,
      submitted_code,
      result,
      error_message,
      ai_analysis,
      concept_tags,
      is_manual_paste,
      submitted_at
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8,
      $9,
      NULL,
      '{}'::text[],
      FALSE,
      $10
    )
    ON CONFLICT (user_id, platform, problem_id, submitted_at) DO NOTHING
  `;

  try {
    await client.query("BEGIN");
    for (const s of submissions) {
      const res = await client.query(query, [
        userId,
        s.platform,
        s.problem_id,
        s.problem_title,
        s.problem_tags,
        s.difficulty,
        s.submitted_code,
        s.result,
        s.error_message,
        s.submitted_at
      ]);
      insertedCount += res.rowCount ?? 0;
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return { insertedCount, totalAttempted: submissions.length };
}

export async function listSubmissions(params: {
  userId: string;
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const offset = (page - 1) * pageSize;

  const query = `
    SELECT
      id,
      user_id,
      platform,
      problem_id,
      problem_title,
      problem_tags,
      difficulty,
      submitted_code,
      result,
      error_message,
      ai_analysis,
      concept_tags,
      is_manual_paste,
      submitted_at
    FROM submissions
    WHERE user_id = $1
    ORDER BY submitted_at DESC
    LIMIT $2 OFFSET $3
  `;

  const result = await db.query<SubmissionRow>(query, [params.userId, pageSize, offset]);
  return {
    submissions: result.rows,
    page,
    pageSize
  };
}
