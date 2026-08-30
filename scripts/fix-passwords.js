const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");

const supabaseUrl = "https://xierfnjisrsfftebblto.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZXJmbmppc3JzZmZ0ZWJibHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczODkxNDMsImV4cCI6MjEwMjk2NTE0M30.0kqUKGP9-LLn3msNoj3SGUwEw5p4-N9A2MGydRRTHdQ";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixPasswords() {
  const passwordHash = await bcrypt.hash("crew123", 10);
  console.log("Generated hash:", passwordHash);

  const { data, error } = await supabase
    .from("users")
    .update({ password_hash: passwordHash })
    .in("username", ["rushil", "pruthvi", "kevin"])
    .select();

  if (error) {
    console.error("Update error:", error);
  } else {
    console.log("Successfully updated users:", data);
  }
}

fixPasswords();
