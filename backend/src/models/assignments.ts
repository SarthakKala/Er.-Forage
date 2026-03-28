import { db } from "../lib/db";

export type AssignmentRow = {
  id: string;
  user_id: string;
  problem_id: string;
  problem_title: string;
  platform_url: string;
  concept_target: string;
  status: "pending" | "completed";
  assigned_at: string;
  completed_at: string | null;
};

export type AssignmentCurrentPayload = {
  id: string;
  problem_title: string;
  platform_url: string;
  concept_target: string;
  status: "pending" | "completed";
  assigned_at: string;
};

export async function countCompletedAssignmentsForUser(userId: string): Promise<number> {
  const query = `
    SELECT COUNT(*)::int AS c
    FROM assignments
    WHERE user_id = $1 AND status = 'completed'
  `;
  const result = await db.query<{ c: number }>(query, [userId]);
  return result.rows[0]?.c ?? 0;
}

export async function countPendingAssignments(userId: string): Promise<number> {
  const query = `
    SELECT COUNT(*)::int AS c
    FROM assignments
    WHERE user_id = $1 AND status = 'pending'
  `;
  const result = await db.query<{ c: number }>(query, [userId]);
  return result.rows[0]?.c ?? 0;
}

export async function listPendingAssignmentsForUser(userId: string): Promise<AssignmentCurrentPayload[]> {
  const query = `
    SELECT
      id,
      problem_title,
      platform_url,
      concept_target,
      status,
      assigned_at
    FROM assignments
    WHERE user_id = $1 AND status = 'pending'
    ORDER BY assigned_at ASC
  `;
  const result = await db.query<AssignmentCurrentPayload>(query, [userId]);
  return result.rows;
}

export async function insertAssignments(params: {
  userId: string;
  rows: Array<{
    problem_id: string;
    problem_title: string;
    platform_url: string;
    concept_target: string;
  }>;
}): Promise<void> {
  if (params.rows.length === 0) return;
  const client = await db.connect();
  const insertQuery = `
    INSERT INTO assignments (
      user_id,
      problem_id,
      problem_title,
      platform_url,
      concept_target,
      status,
      assigned_at
    )
    VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
  `;
  try {
    await client.query("BEGIN");
    for (const row of params.rows) {
      await client.query(insertQuery, [
        params.userId,
        row.problem_id,
        row.problem_title,
        row.platform_url,
        row.concept_target
      ]);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function completeAssignmentById(params: {
  userId: string;
  assignmentId: string;
}): Promise<AssignmentRow | null> {
  const query = `
    UPDATE assignments
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = $1 AND user_id = $2 AND status = 'pending'
    RETURNING
      id,
      user_id,
      problem_id,
      problem_title,
      platform_url,
      concept_target,
      status,
      assigned_at,
      completed_at
  `;
  const result = await db.query<AssignmentRow>(query, [params.assignmentId, params.userId]);
  return result.rows[0] ?? null;
}

export async function autoCompletePendingAssignmentsByProblemIds(params: {
  userId: string;
  acceptedProblemIds: string[];
}): Promise<number> {
  if (params.acceptedProblemIds.length === 0) return 0;
  const query = `
    UPDATE assignments
    SET status = 'completed',
        completed_at = NOW()
    WHERE user_id = $1
      AND status = 'pending'
      AND problem_id = ANY($2::text[])
    RETURNING id
  `;
  const result = await db.query<{ id: string }>(query, [
    params.userId,
    params.acceptedProblemIds
  ]);
  return result.rowCount ?? 0;
}
