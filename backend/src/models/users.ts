import { db } from "../lib/db";

export type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
};

type UpsertUserInput = {
  email: string;
  name: string;
  avatarUrl?: string | null;
};

export async function upsertUser(input: UpsertUserInput): Promise<User> {
  const query = `
    INSERT INTO users (email, name, avatar_url)
    VALUES ($1, $2, $3)
    ON CONFLICT (email)
    DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
    RETURNING id, email, name, avatar_url, created_at
  `;
  const values = [input.email, input.name, input.avatarUrl ?? null];
  const result = await db.query<User>(query, values);
  return result.rows[0];
}

export async function getUserById(userId: string): Promise<User | null> {
  const result = await db.query<User>(
    "SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1 LIMIT 1",
    [userId]
  );
  return result.rows[0] ?? null;
}
