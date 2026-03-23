import { db } from "../lib/db";

export type PlatformConnection = {
  id: string;
  user_id: string;
  platform: "leetcode" | "codeforces";
  leetcode_session: string | null;
  csrf_token: string | null;
  connected_at: string;
};

type UpsertConnectionInput = {
  userId: string;
  platform: "leetcode" | "codeforces";
  leetcodeSessionEncrypted: string;
  csrfTokenEncrypted: string;
};

export async function upsertPlatformConnection(
  input: UpsertConnectionInput
): Promise<{ id: string; platform: string; connected_at: string }> {
  const query = `
    INSERT INTO platform_connections (user_id, platform, leetcode_session, csrf_token)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, platform)
    DO UPDATE
      SET leetcode_session = EXCLUDED.leetcode_session,
          csrf_token = EXCLUDED.csrf_token,
          connected_at = NOW()
    RETURNING id, platform, connected_at
  `;

  const values = [
    input.userId,
    input.platform,
    input.leetcodeSessionEncrypted,
    input.csrfTokenEncrypted
  ];
  const result = await db.query<{
    id: string;
    platform: string;
    connected_at: string;
  }>(query, values);

  return result.rows[0];
}

export async function listPlatformConnections(userId: string) {
  const query = `
    SELECT id, platform, connected_at
    FROM platform_connections
    WHERE user_id = $1
    ORDER BY connected_at DESC
  `;
  const result = await db.query<{ id: string; platform: string; connected_at: string }>(query, [
    userId
  ]);
  return result.rows;
}

export async function getPlatformConnectionByPlatform(params: {
  userId: string;
  platform: "leetcode" | "codeforces";
}): Promise<PlatformConnection | null> {
  const query = `
    SELECT id, user_id, platform, leetcode_session, csrf_token, connected_at
    FROM platform_connections
    WHERE user_id = $1 AND platform = $2
    LIMIT 1
  `;
  const result = await db.query<PlatformConnection>(query, [params.userId, params.platform]);
  return result.rows[0] ?? null;
}

export async function disconnectPlatformConnection(params: {
  userId: string;
  connectionId: string;
}): Promise<boolean> {
  const query = `
    DELETE FROM platform_connections
    WHERE user_id = $1 AND id = $2
  `;
  const result = await db.query(query, [params.userId, params.connectionId]);
  return (result.rowCount ?? 0) > 0;
}
