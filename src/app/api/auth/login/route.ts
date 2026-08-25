import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Query user from Supabase
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", cleanUsername)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    if (user.status === "inactive") {
      return NextResponse.json({ error: "Account has been deactivated" }, { status: 403 });
    }

    // Verify password hash
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Create session token
    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
