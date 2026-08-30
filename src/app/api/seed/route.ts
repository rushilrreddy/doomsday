import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    // Check existing users
    const { data: existingUsers, error: fetchErr } = await supabase.from("users").select("username");

    if (fetchErr) {
      return NextResponse.json({ 
        error: "Table access error. Please ensure table structure is created in Supabase SQL editor using supabase-schema.sql.", 
        details: fetchErr.message 
      }, { status: 500 });
    }

    const usernames = existingUsers ? existingUsers.map((u) => u.username.toLowerCase()) : [];
    const defaultPasswordHash = await hashPassword("crew123");

    const defaultUsers = [
      { username: "rushil", role: "leader" },
      { username: "pruthvi", role: "member" },
      { username: "kevin", role: "member" },
    ];

    const insertedUsers = [];

    for (const u of defaultUsers) {
      if (!usernames.includes(u.username)) {
        const { data: newUser, error: insertErr } = await supabase
          .from("users")
          .insert([
            {
              username: u.username,
              password_hash: defaultPasswordHash,
              role: u.role,
              status: "active",
            },
          ])
          .select()
          .single();

        if (insertErr) {
          return NextResponse.json({
            error: "Failed to seed user due to Supabase RLS policy.",
            details: insertErr.message,
            solution: "Please run the SQL script in 'supabase-schema.sql' inside your Supabase SQL Editor to set permissive RLS access and insert initial users.",
          }, { status: 403 });
        }

      }
    }

    // Check if an active goal exists, if not, create initial shared challenge
    const { data: activeGoal } = await supabase.from("goals").select("id").eq("status", "active").single();
    if (!activeGoal) {
      const { data: leaderUser } = await supabase.from("users").select("id").eq("username", "rushil").single();
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30); // 30 days challenge

      await supabase.from("goals").insert([
        {
          title: "30-Day Beast Mode Challenge",
          description: "Complete daily fitness & learning tasks without missing a single day!",
          target_date: targetDate.toISOString(),
          stake: "Loser buys dinner 🍕 + 50 pushups",
          status: "active",
          created_by: leaderUser?.id || null,
        },
      ]);
    }

    return NextResponse.json({
      success: true,
      message: "Database seed check complete",
      seededUsersCount: insertedUsers.length,
      defaultCredentialsNote: "Default password for seeded accounts is 'crew123'",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Seed error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
