import dotenv from "dotenv";

dotenv.config();

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 4000),
  // Default matches the V1 specification so local boot doesn't fail.
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:3000",
  DATABASE_URL: getEnv("DATABASE_URL"),
  SUPABASE_URL: process.env.SUPABASE_URL ?? "",
  SUPABASE_KEY: process.env.SUPABASE_KEY ?? "",
  GOOGLE_CLIENT_ID: getEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getEnv("GOOGLE_CLIENT_SECRET"),
  JWT_SECRET: getEnv("JWT_SECRET")
};
