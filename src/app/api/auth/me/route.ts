import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Fetch latest user details from DB
  const { data: user, error } = await supabase
    .from("users")
    .select("id, username, role, status, created_at")
    .eq("id", session.userId)
    .single();

  if (error || !user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
