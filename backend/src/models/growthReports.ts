import { db } from "../lib/db";

export type GrowthReportRow = {
  id: string;
  user_id: string;
  token: string;
  snapshot_data: unknown;
  period: string | null;
  created_at: string;
};

export type GrowthReportListRow = {
  id: string;
  token: string;
  created_at: string;
  report_name: string | null;
};

export async function insertGrowthReport(params: {
  userId: string;
  snapshotData: Record<string, unknown>;
  period?: "weekly" | "monthly";
}): Promise<GrowthReportRow> {
  const period = params.period ?? "weekly";
  const query = `
    INSERT INTO growth_reports (user_id, snapshot_data, period)
    VALUES ($1, $2::jsonb, $3)
    RETURNING id, user_id, token, snapshot_data, period, created_at
  `;
  const result = await db.query<GrowthReportRow>(query, [
    params.userId,
    JSON.stringify(params.snapshotData),
    period
  ]);
  const row = result.rows[0];
  if (!row) throw new Error("Failed to insert growth report");
  return row;
}

export async function getGrowthReportByToken(token: string): Promise<GrowthReportRow | null> {
  const query = `
    SELECT id, user_id, token, snapshot_data, period, created_at
    FROM growth_reports
    WHERE token = $1::uuid
    LIMIT 1
  `;
  const result = await db.query<GrowthReportRow>(query, [token]);
  return result.rows[0] ?? null;
}

export async function listGrowthReportsByUser(userId: string): Promise<GrowthReportListRow[]> {
  const query = `
    SELECT
      id,
      token,
      created_at,
      COALESCE(snapshot_data->>'report_name', NULL) AS report_name
    FROM growth_reports
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  const result = await db.query<GrowthReportListRow>(query, [userId]);
  return result.rows;
}

export async function renameGrowthReportById(params: {
  userId: string;
  reportId: string;
  reportName: string;
}): Promise<GrowthReportListRow | null> {
  const query = `
    UPDATE growth_reports
    SET snapshot_data = jsonb_set(
      COALESCE(snapshot_data, '{}'::jsonb),
      '{report_name}',
      to_jsonb($3::text),
      true
    )
    WHERE id = $1 AND user_id = $2
    RETURNING
      id,
      token,
      created_at,
      COALESCE(snapshot_data->>'report_name', NULL) AS report_name
  `;
  const result = await db.query<GrowthReportListRow>(query, [
    params.reportId,
    params.userId,
    params.reportName
  ]);
  return result.rows[0] ?? null;
}

export async function renameGrowthReportByToken(params: {
  userId: string;
  token: string;
  reportName: string;
}): Promise<GrowthReportListRow | null> {
  const query = `
    UPDATE growth_reports
    SET snapshot_data = jsonb_set(
      COALESCE(snapshot_data, '{}'::jsonb),
      '{report_name}',
      to_jsonb($3::text),
      true
    )
    WHERE token = $1::uuid AND user_id = $2
    RETURNING
      id,
      token,
      created_at,
      COALESCE(snapshot_data->>'report_name', NULL) AS report_name
  `;
  const result = await db.query<GrowthReportListRow>(query, [
    params.token,
    params.userId,
    params.reportName
  ]);
  return result.rows[0] ?? null;
}

export async function deleteGrowthReportById(params: {
  userId: string;
  reportId: string;
}): Promise<boolean> {
  const query = `
    DELETE FROM growth_reports
    WHERE id = $1 AND user_id = $2
  `;
  const result = await db.query(query, [params.reportId, params.userId]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteGrowthReportByToken(params: {
  userId: string;
  token: string;
}): Promise<boolean> {
  const query = `
    DELETE FROM growth_reports
    WHERE token = $1::uuid AND user_id = $2
  `;
  const result = await db.query(query, [params.token, params.userId]);
  return (result.rowCount ?? 0) > 0;
}
