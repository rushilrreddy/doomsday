import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || ""
  );
}

function initWebPush() {
  if (process.env.VAPID_SUBJECT && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    } catch { /* ignore */ }
  }
}

function fmt(mins: number) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
}

export async function POST() {
  try {
    const supabase = getSupabase();
    initWebPush();

    // Compute week boundaries (Mon–Sun)
    const now = new Date();
    const monday = new Date(now);
    const day = monday.getDay() === 0 ? -6 : 1 - monday.getDay();
    monday.setDate(monday.getDate() + day);
    monday.setHours(0, 0, 0, 0);
    const startStr = monday.toISOString().split("T")[0];
    const todayStr = now.toISOString().split("T")[0];

    const [
      { data: users },
      { data: studyLogs },
      { data: tasks },
      { data: streaks },
    ] = await Promise.all([
      supabase.from("users").select("id, username"),
      supabase.from("study_logs").select("user_id, problems_solved, duration_minutes, category").gte("log_date", startStr).lte("log_date", todayStr),
      supabase.from("tasks").select("user_id, is_done, task_date").gte("task_date", startStr).lte("task_date", todayStr),
      supabase.from("streaks").select("user_id, current_streak"),
    ]);

    if (!users) return NextResponse.json({ error: "No users" }, { status: 500 });

    // Per-user stats
    const stats = users.map((u: { id: string; username: string }) => {
      const myLogs  = (studyLogs || []).filter((l: { user_id: string }) => l.user_id === u.id);
      const myTasks = (tasks    || []).filter((t: { user_id: string }) => t.user_id === u.id);
      const myStreak = (streaks || []).find((s: { user_id: string }) => s.user_id === u.id);
      return {
        username:    u.username,
        problems:    myLogs.filter((l: { category: string }) => l.category === "dsa").reduce((s: number, l: { problems_solved: number }) => s + l.problems_solved, 0),
        studyMins:   myLogs.reduce((s: number, l: { duration_minutes: number }) => s + l.duration_minutes, 0),
        tasksDone:   myTasks.filter((t: { is_done: boolean }) => t.is_done).length,
        streak:      myStreak?.current_streak || 0,
      };
    });

    // Rankings
    const byProblems   = [...stats].sort((a, b) => b.problems   - a.problems)[0];
    const byStudy      = [...stats].sort((a, b) => b.studyMins  - a.studyMins)[0];
    const byTasks      = [...stats].sort((a, b) => b.tasksDone  - a.tasksDone)[0];
    const byStreak     = [...stats].sort((a, b) => b.streak     - a.streak)[0];

    const lines = [
      `📊 Weekly Crew Report`,
      ``,
      byProblems.problems > 0   ? `💻 DSA King: ${byProblems.username} (${byProblems.problems} problems)` : null,
      byStudy.studyMins   > 0   ? `📚 Study Beast: ${byStudy.username} (${fmt(byStudy.studyMins)})` : null,
      byTasks.tasksDone   > 0   ? `✅ Task Machine: ${byTasks.username} (${byTasks.tasksDone} done)` : null,
      byStreak.streak     > 0   ? `🔥 Longest Streak: ${byStreak.username} (${byStreak.streak} days)` : null,
      ``,
      stats.map((s) => `${s.username}: ${s.problems} probs · ${fmt(s.studyMins)} studied · ${s.tasksDone} tasks`).join("\n"),
    ].filter(Boolean).join("\n");

    // Write to activity feed
    await supabase.from("activity_feed").insert([{
      user_id: users[0].id, type: "weekly_report", content: lines,
    }]);

    // Send push to all subscribers
    const { data: subs } = await supabase.from("push_subscriptions").select("*");
    if (subs?.length) {
      await Promise.allSettled(subs.map(async (sub: { endpoint: string; p256dh: string; auth: string; id: string }) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: "Countdown Crew Weekly 📊", body: `${byProblems.problems > 0 ? `${byProblems.username} led DSA this week with ${byProblems.problems} problems!` : "Check your weekly recap!"}`, url: "/" })
          );
        } catch (err: unknown) {
          const error = err as { statusCode?: number };
          if (error.statusCode === 410) await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }));
    }

    return NextResponse.json({ ok: true, stats });
  } catch (err) {
    console.error("Weekly report error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
