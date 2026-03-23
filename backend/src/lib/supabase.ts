import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

export function createSupabaseClient(supabaseUrl: string, supabaseKey: string) {
  return createClient(supabaseUrl, supabaseKey);
}

export const supabase =
  env.SUPABASE_URL && env.SUPABASE_KEY
    ? createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_KEY)
    : null;
