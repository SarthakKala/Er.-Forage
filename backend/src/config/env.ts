import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.warn(`[env] Missing required environment variable: ${name}`);
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const PORT = Number(process.env.PORT ?? 4000);

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT,
  /** Public base URL of this API (no trailing slash). Used for Google OAuth callback. */
  BACKEND_URL: (process.env.BACKEND_URL ?? `http://localhost:${PORT}`).replace(/\/+$/, ""),
  // Default matches the V1 specification so local boot doesn't fail.
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:3000",
  DATABASE_URL: getEnv("DATABASE_URL"),
  SUPABASE_URL: process.env.SUPABASE_URL ?? "",
  SUPABASE_KEY: process.env.SUPABASE_KEY ?? "",
  GOOGLE_CLIENT_ID: getEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getEnv("GOOGLE_CLIENT_SECRET"),
  JWT_SECRET: getEnv("JWT_SECRET"),
  OPENROUTER_API_KEY: getEnv("OPENROUTER_API_KEY")
};
