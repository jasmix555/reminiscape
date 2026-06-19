import { supabase } from "./supabaseClient";

// Public demo account, seeded by sql/seed_demo.sql. These credentials are
// intentionally shareable — it's a read-mostly showcase account so anyone can
// try the app without signing up.
export const DEMO_EMAIL = "demo@reminiscape.app";
export const DEMO_PASSWORD = "demo-password-123";

export const signInAsDemo = () =>
  supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
