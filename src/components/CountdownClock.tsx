"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface CountdownClockProps {
  targetDate: string;
  startDate: string | null;
  title: string;
  stake: string;
  status: "active" | "achieved" | "failed";
}

interface TimeLeft { days: number; hours: number; minutes: number; }

function Digit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center flex-1">
      <div
        className="w-full flex items-center justify-center rounded-xl relative overflow-hidden"
        style={{ background: "#1c1c1c", border: "1px solid #252525", paddingTop: "75%", position: "relative" }}
      >
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={value}
              initial={{ y: "-50%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "50%", opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="font-black tabular-nums"
              style={{ fontSize: "clamp(16px, 5vw, 26px)", color: "#f0f0f0", lineHeight: 1 }}
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <span className="mt-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: "#444" }}>
        {label}
      </span>
    </div>
  );
}

export function CountdownClock({ targetDate, startDate, title, stake, status }: CountdownClockProps) {
  const [time, setTime] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0 });
  const [done, setDone] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTime({ days: 0, hours: 0, minutes: 0 });
        if (!done) {
          setDone(true);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
        }
        return;
      }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
      });
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [targetDate, done]);

  const pad = (n: number) => String(n).padStart(2, "0");

  // Calculate progress % if start date exists
  const totalDuration = startDate
    ? new Date(targetDate).getTime() - new Date(startDate).getTime()
    : null;
  const elapsed = startDate
    ? Math.max(0, Date.now() - new Date(startDate).getTime())
    : null;
  const progressPct = totalDuration && elapsed != null
    ? Math.min(100, Math.round((elapsed / totalDuration) * 100))
    : null;

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" });

  return (
    <div className="card p-3.5 space-y-3">
      {/* Title row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              background: status === "active" ? "#0d1a10" : status === "achieved" ? "#0d1a10" : "#1a0d0d",
              color: status === "active" ? "#22c55e" : status === "achieved" ? "#22c55e" : "#ef4444",
              border: `1px solid ${status !== "failed" ? "#22c55e20" : "#ef444420"}`,
            }}
          >
            {status === "active" ? "Live" : status}
          </span>
          <h2 className="font-black text-sm leading-tight truncate" style={{ color: "#f0f0f0" }}>
            {title}
          </h2>
        </div>
      </div>

      {/* 3-digit countdown */}
      <div className="grid grid-cols-3 gap-2">
        <Digit value={String(time.days).padStart(2, "0")} label="Days" />
        <Digit value={pad(time.hours)} label="Hours" />
        <Digit value={pad(time.minutes)} label="Mins" />
      </div>

      {/* Progress bar + date range (only if start_date set) */}
      {progressPct != null && startDate && (
        <div className="space-y-1.5">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "#222" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "#22c55e" }}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-[9px] font-semibold" style={{ color: "#444" }}>
              {fmtDate(startDate)}
            </span>
            <span className="text-[9px] font-bold" style={{ color: "#555" }}>
              {progressPct}% elapsed
            </span>
            <span className="text-[9px] font-semibold" style={{ color: "#444" }}>
              {fmtDate(targetDate)}
            </span>
          </div>
        </div>
      )}

      {/* Stake — compact */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: "#1c1c1c", border: "1px solid #222" }}
      >
        <span className="text-sm">🎯</span>
        <p className="text-xs font-semibold truncate" style={{ color: "#c0c0c0" }}>{stake}</p>
      </div>
    </div>
  );
}
