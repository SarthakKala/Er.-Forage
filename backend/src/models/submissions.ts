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

export type InsertedSubmissionSyncInfo = {
  problem_id: string;
  result: SubmissionRow["result"];
};

export async function insertSubmissions(params: {
  userId: string;
  submissions: SubmissionDraft[];
}): Promise<{
  insertedCount: number;
  totalAttempted: number;
  insertedForSync: InsertedSubmissionSyncInfo[];
}> {
  const { userId, submissions } = params;
  const client = await db.connect();
  let insertedCount = 0;
  const insertedForSync: InsertedSubmissionSyncInfo[] = [];

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
    RETURNING problem_id, result
  `;

  try {
    await client.query("BEGIN");
    for (const s of submissions) {
      const res = await client.query<{ problem_id: string; result: string }>(query, [
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
      const n = res.rowCount ?? 0;
      insertedCount += n;
      if (n > 0 && res.rows[0]) {
        insertedForSync.push({
          problem_id: res.rows[0].problem_id,
          result: res.rows[0].result as SubmissionRow["result"]
        });
      }
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return { insertedCount, totalAttempted: submissions.length, insertedForSync };
}

export async function insertManualPasteSubmission(params: {
  userId: string;
  problemId: string;
  problemTitle: string;
  code: string;
  result: SubmissionRow["result"];
  difficulty: SubmissionRow["difficulty"];
}): Promise<SubmissionRow> {
  const submittedAt = new Date().toISOString();
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
      $1, 'leetcode', $2, $3, '{}'::text[], $4, $5, $6,
      NULL, NULL, '{}'::text[], TRUE, $7
    )
    RETURNING
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
  `;
  const result = await db.query<SubmissionRow>(query, [
    params.userId,
    params.problemId,
    params.problemTitle,
    params.difficulty,
    params.code,
    params.result,
    submittedAt
  ]);
  const row = result.rows[0];
  if (!row) throw new Error("Failed to insert manual submission");
  return row;
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

export async function listUnanalysedSubmissionsForUser(userId: string): Promise<SubmissionRow[]> {
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
      AND (
        ai_analysis IS NULL
        OR ai_analysis = ''
        OR concept_tags IS NULL
        OR cardinality(concept_tags) = 0
      )
    ORDER BY submitted_at DESC
  `;

  const result = await db.query<SubmissionRow>(query, [userId]);
  return result.rows;
}

export async function updateSubmissionAnalysis(params: {
  submissionId: string;
  aiAnalysis: string;
  conceptTags: string[];
}) {
  const query = `
    UPDATE submissions
    SET ai_analysis = $2,
        concept_tags = $3
    WHERE id = $1
  `;
  await db.query(query, [params.submissionId, params.aiAnalysis, params.conceptTags]);
}

export async function countSubmissionsForUser(userId: string): Promise<number> {
  const query = `
    SELECT COUNT(*)::int AS c
    FROM submissions
    WHERE user_id = $1
  `;
  const result = await db.query<{ c: number }>(query, [userId]);
  return result.rows[0]?.c ?? 0;
}

/** Distinct LeetCode problems with at least one accepted submission. */
export async function countDistinctAcceptedProblemsForUser(userId: string): Promise<number> {
  const query = `
    SELECT COUNT(DISTINCT problem_id)::int AS c
    FROM submissions
    WHERE user_id = $1 AND result = 'accepted'
  `;
  const result = await db.query<{ c: number }>(query, [userId]);
  return result.rows[0]?.c ?? 0;
}

export async function getEarliestSubmissionDateForUser(userId: string): Promise<string | null> {
  const query = `
    SELECT MIN(submitted_at) AS first_at
    FROM submissions
    WHERE user_id = $1
  `;
  const result = await db.query<{ first_at: string | null }>(query, [userId]);
  return result.rows[0]?.first_at ?? null;
}

export async function listSubmissionsByConcept(params: {
  userId: string;
  concept: string;
}): Promise<SubmissionRow[]> {
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
      AND $2 = ANY(concept_tags)
    ORDER BY submitted_at DESC
  `;
  const result = await db.query<SubmissionRow>(query, [params.userId, params.concept]);
  return result.rows;
}
