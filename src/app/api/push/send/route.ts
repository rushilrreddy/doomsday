import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "@/lib/supabase";

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

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  excludeUserId?: string; // don't send to the person who triggered it
}

// POST /api/push/send
export async function POST(req: NextRequest) {
  initWebPush();
  const payload: PushPayload = await req.json();

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id");

  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 });

  const targets = payload.excludeUserId
    ? subs.filter((s) => s.user_id !== payload.excludeUserId)
    : subs;

  const notification = JSON.stringify({
    title: payload.title,
    body:  payload.body,
    icon:  payload.icon  || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    url:   payload.url   || "/",
  });

  let sent = 0;
  const stale: string[] = [];

  await Promise.allSettled(
    targets.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification,
          { TTL: 60 * 60 * 24 }
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        // 410 = subscription expired/unsubscribed
        if (statusCode === 410 || statusCode === 404) {
          stale.push(sub.endpoint);
        }
      }
    })
  );

  // Clean up stale subscriptions
  if (stale.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", stale);
  }

  return NextResponse.json({ sent, stale: stale.length });
}
