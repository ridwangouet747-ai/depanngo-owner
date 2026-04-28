// Client Supabase pour l'app mobile (auth persistante)
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zlmuzknxabuoeilodpad.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsbXV6a254YWJ1b2VpbG9kcGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzI3MjUsImV4cCI6MjA5MjU0ODcyNX0.3MVnf9-m26X1fXXGt2epnEHUQ7aSPi9o_BqgjoXsDtM";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: "depanngo-client-auth",
    autoRefreshToken: true,
  },
});
