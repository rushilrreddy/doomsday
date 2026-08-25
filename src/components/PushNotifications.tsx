"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, BellRing } from "lucide-react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type PermState = "default" | "granted" | "denied" | "unsupported";

export function PushNotifications() {
  const [permState, setPermState] = useState<PermState>("default");
  const [subscribed, setSubscribed]   = useState(false);
  const [loading,    setLoading]      = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermState("unsupported");
      return;
    }
    setPermState(Notification.permission as PermState);

    // Check if already subscribed
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermState(permission as PermState);
      if (permission !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      await fetch("/api/push/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(sub.toJSON()),
      });

      setSubscribed(true);
    } catch (err) {
      console.error("Push subscribe error:", err);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method:  "DELETE",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  };

  if (permState === "unsupported") return null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {subscribed
            ? <BellRing className="w-4 h-4" style={{ color: "#22c55e" }} />
            : <Bell    className="w-4 h-4" style={{ color: "#555" }} />
          }
          <div>
            <p className="text-sm font-bold" style={{ color: "#f0f0f0" }}>
              Push Notifications
            </p>
            <p className="text-[10px]" style={{ color: "#555" }}>
              {permState === "denied"
                ? "Blocked in browser settings"
                : subscribed
                ? "You'll get crew activity alerts"
                : "Get notified when crew logs or completes goals"}
            </p>
          </div>
        </div>

        {permState === "denied" ? (
          <BellOff className="w-4 h-4" style={{ color: "#555" }} />
        ) : (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={subscribed ? unsubscribe : subscribe}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: subscribed ? "#1c1c1c" : "#22c55e18",
              color:      subscribed ? "#555"    : "#22c55e",
              border:     `1px solid ${subscribed ? "#252525" : "#22c55e30"}`,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "…" : subscribed ? "Turn off" : "Enable"}
          </motion.button>
        )}
      </div>
    </div>
  );
}
