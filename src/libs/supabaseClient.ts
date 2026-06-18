// src/libs/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Helps catch a missing .env.local early instead of cryptic runtime errors.
  console.warn(
    "Supabase env vars missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
  );
}

// Single browser client. Sessions persist in localStorage and OAuth / email
// confirmation redirects are picked up automatically (detectSessionInUrl).
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
