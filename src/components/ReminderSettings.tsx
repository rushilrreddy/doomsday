"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Monitor, Snowflake, Shield, Info } from "lucide-react";
import { Streak, User } from "@/lib/types";

interface ReminderSettingsProps {
  currentUser?: User;
  streaks?: Streak[];
}

export function ReminderSettings({ currentUser, streaks = [] }: ReminderSettingsProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("20:00");
  const [saved, setSaved] = useState(false);
  const [amoled, setAmoled] = useState(false);

  const myStreak = (streaks || []).find((s) => s && s.user_id === currentUser?.id);
  const freezeTokens = Math.min(5, Math.max(0, myStreak?.freeze_tokens ?? 1));

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
      navigator.serviceWorker.ready.then((sw) => {
        sw.showNotification("DOOMSDAY 🔥", {
          body: `Don't forget to submit your daily check-in and tasks!`,
          icon: "/icons/icon-192.png",
        });
      });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Streak Freeze Inventory (Max 5) */}
      <div
        className="card p-4 space-y-3"
        style={{
          background: "linear-gradient(135deg, #091924, #0b1118)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-cyan-400"
              style={{ background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)" }}
            >
              <Snowflake className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Streak Freeze Inventory</p>
              <p className="text-[10px] text-cyan-300/80">Protect unbroken streaks against missed days</p>
            </div>
          </div>

          <span
            className="text-xs font-black px-2.5 py-1 rounded-xl text-cyan-300"
            style={{ background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)" }}
          >
            {freezeTokens} / 5 Freezes Left
          </span>
        </div>

        {/* Visual Token Slots */}
        <div className="flex gap-1.5 pt-1">
          {[1, 2, 3, 4, 5].map((slot) => {
            const hasToken = slot <= freezeTokens;
            return (
              <div
                key={slot}
                className="flex-1 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: hasToken ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.03)",
                  border: `1px solid ${hasToken ? "rgba(56, 189, 248, 0.4)" : "rgba(255, 255, 255, 0.06)"}`,
                }}
              >
                {hasToken ? (
                  <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <span className="text-[9px] text-gray-600 font-bold">{slot}</span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-gray-400 leading-relaxed">
          💡 Earn 1 freeze token after every 7-day active streak (maximum capacity: 5). If you miss a day, spend 1 token to keep your streak intact.
        </p>
      </div>

      {/* AMOLED toggle */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-gray-400" />
            <div>
              <span className="font-bold text-sm text-white">AMOLED Mode</span>
              <p className="text-[10px] text-gray-500">Pure #000 black — saves battery on OLED screens</p>
            </div>
          </div>
          <div
            onClick={() => toggleAmoled(!amoled)}
            className="w-10 h-5 rounded-full relative cursor-pointer transition-colors"
            style={{ background: amoled ? "#22c55e" : "#2a2a2a" }}
          >
            <motion.div
              animate={{ x: amoled ? 20 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
            />
          </div>
        </div>
      </div>

      {/* DOOMSDAY Daily Reminder */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-400" />
            <div>
              <span className="font-bold text-sm text-white">DOOMSDAY Daily Reminder</span>
              <p className="text-[10px] text-gray-500">Local notifications to log tasks and habits</p>
            </div>
          </div>
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
                <button
                  onClick={requestPermission}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-purple-500/10 border border-purple-500/30 text-purple-300"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Allow Notifications
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <Check className="w-3.5 h-3.5" /> DOOMSDAY notifications enabled
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-400">Remind at</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="input-field flex-1 py-1.5"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={saveReminder}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
          style={{
            background: saved ? "#0d1a10" : "#1c1c1c",
            border: `1px solid ${saved ? "#22c55e30" : "#2a2a2a"}`,
            color: saved ? "#22c55e" : "#f0f0f0",
          }}
        >
          {saved ? <><Check className="w-3.5 h-3.5" /> Settings Saved!</> : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
