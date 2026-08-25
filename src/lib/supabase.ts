import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xierfnjisrsfftebblto.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZXJmbmppc3JzZmZ0ZWJibHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczODkxNDMsImV4cCI6MjEwMjk2NTE0M30.0kqUKGP9-LLn3msNoj3SGUwEw5p4-N9A2MGydRRTHdQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
