// src/libs/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
// Accept either the new publishable key or the legacy anon key, under either
// env var name — both are the browser-safe client key.
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) as string;

if (!url || !anonKey) {
  console.warn(
    "Supabase env vars missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in .env.local",
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
