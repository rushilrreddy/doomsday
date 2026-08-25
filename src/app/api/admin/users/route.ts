import { NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "leader") {
    return NextResponse.json({ error: "Forbidden: Leader access required" }, { status: 403 });
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("id, username, role, status, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSession();

  // STRICT SERVER-SIDE ROLE ENFORCEMENT
  if (!session || session.role !== "leader") {
    return NextResponse.json({ error: "Forbidden: Leader access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "reset_password") {
      const { userId, newPassword } = body;
      if (!userId || !newPassword || newPassword.trim().length < 4) {
        return NextResponse.json({ error: "User ID and valid new password (min 4 chars) required" }, { status: 400 });
      }

      const password_hash = await hashPassword(newPassword.trim());

      const { error } = await supabase
        .from("users")
        .update({ password_hash })
        .eq("id", userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Password updated successfully" });
    }

    if (action === "create_user") {
      const { username, password } = body;
      if (!username || !password || password.trim().length < 4) {
        return NextResponse.json({ error: "Username and valid password (min 4 chars) required" }, { status: 400 });
      }

      const cleanUsername = username.trim().toLowerCase();
      const password_hash = await hashPassword(password.trim());

      const { data: newUser, error } = await supabase
        .from("users")
        .insert([
          {
            username: cleanUsername,
            password_hash,
            role: "member",
            status: "active",
          },
        ])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Initialize streak row for new user
      await supabase.from("streaks").insert([
        {
          user_id: newUser.id,
          current_streak: 0,
          longest_streak: 0,
        },
      ]);

      return NextResponse.json({ success: true, user: newUser });
    }

    if (action === "toggle_status") {
      const { userId, status } = body;
      if (!userId || !["active", "inactive"].includes(status)) {
        return NextResponse.json({ error: "Invalid user ID or status" }, { status: 400 });
      }

      // Prevent deactivating leader's own account
      if (userId === session.userId && status === "inactive") {
        return NextResponse.json({ error: "Leader cannot deactivate their own account" }, { status: 400 });
      }

      const { error } = await supabase
        .from("users")
        .update({ status })
        .eq("id", userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, status });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
