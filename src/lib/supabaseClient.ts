import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Environment variable NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  if (!supabaseKey) {
    throw new Error("Environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY is required.");
  }

  return createClient(supabaseUrl, supabaseKey);
}
