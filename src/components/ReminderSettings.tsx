"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Check, Monitor } from "lucide-react";

export function ReminderSettings() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("20:00");
  const [saved, setSaved] = useState(false);
  const [amoled, setAmoled] = useState(false);

  const toggleAmoled = (next: boolean) => {
    setAmoled(next);
    localStorage.setItem("crew_amoled", next ? "1" : "0");
    document.documentElement.setAttribute("data-amoled", next ? "true" : "false");
  };

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
    const stored = localStorage.getItem("crew_reminder");
    if (stored) {
      const parsed = JSON.parse(stored);
      setEnabled(parsed.enabled);
      setTime(parsed.time || "20:00");
    }
    const amoledStored = localStorage.getItem("crew_amoled");
    if (amoledStored === "1") {
      setAmoled(true);
      document.documentElement.setAttribute("data-amoled", "true");
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setPermission(perm);
  };

  const saveReminder = () => {
    const data = { enabled, time };
    localStorage.setItem("crew_reminder", JSON.stringify(data));

    if (enabled && "serviceWorker" in navigator && permission === "granted") {
      // Schedule a local test notification
      navigator.serviceWorker.ready.then((sw) => {
        sw.showNotification("Countdown Crew 🔥", {
          body: `Don't forget to log your tasks for today!`,
          icon: "/icons/icon-192.png",
        });
      });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* AMOLED toggle */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4" style={{ color: "#555" }} />
            <div>
              <span className="font-bold text-sm" style={{ color: "#f0f0f0" }}>AMOLED Mode</span>
              <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>Pure #000 black — saves battery on OLED screens</p>
            </div>
          </div>
          <div onClick={() => toggleAmoled(!amoled)}
            className="w-10 h-5 rounded-full relative cursor-pointer transition-colors"
            style={{ background: amoled ? "#22c55e" : "#2a2a2a" }}>
            <motion.div
              animate={{ x: amoled ? 20 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
            />
          </div>
        </div>
      </div>

      {/* Reminder */}
      <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: "#555" }} />
          <span className="font-bold text-sm" style={{ color: "#f0f0f0" }}>Daily Reminder</span>
        </div>
        {/* Toggle */}
        <div
          onClick={() => setEnabled(!enabled)}
          className="w-10 h-5 rounded-full relative cursor-pointer transition-colors"
          style={{ background: enabled ? "#7c5cfc" : "#2a2a2a" }}
        >
          <motion.div
            animate={{ x: enabled ? 20 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
          />
        </div>
      </div>

      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-3"
          >
            {permission !== "granted" ? (
              <button onClick={requestPermission}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold"
                style={{ background: "#1c1c1c", border: "1px solid #2a2a2a", color: "#f0f0f0" }}>
                <Bell className="w-3.5 h-3.5" />
                Allow Notifications
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs" style={{ color: "#22c55e" }}>
                <Check className="w-3.5 h-3.5" /> Notifications allowed
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold" style={{ color: "#666" }}>Remind at</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input-field flex-1"
                style={{ padding: "8px 12px" }}
              />
            </div>

            <p className="text-[11px]" style={{ color: "#444" }}>
              Tip: For automatic daily reminders, add this app to your home screen and keep it open in the background.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={saveReminder}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
        style={{
          background: saved ? "#0d1a10" : "#1c1c1c",
          border: `1px solid ${saved ? "#22c55e30" : "#2a2a2a"}`,
          color: saved ? "#22c55e" : "#f0f0f0",
        }}>
        {saved ? <><Check className="w-3.5 h-3.5" /> Saved!</> : "Save Settings"}
      </button>
    </div>
    </div>
  );
}
