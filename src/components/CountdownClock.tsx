"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { MoreVertical, Check, Edit2, X, Plus, ChevronDown, ChevronUp, Flame } from "lucide-react";

interface CountdownClockProps {
  targetDate: string;
  startDate: string | null;
  title: string;
  stake: string;
  status: "active" | "achieved" | "failed";
  onMarkAchieved?: () => void;
  onEdit?: () => void;
  onMarkFailed?: () => void;
  onNewChallenge?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function Digit({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <div
        className="w-full flex items-center justify-center rounded-2xl relative overflow-hidden"
        style={{
          background: highlight ? "#1a162b" : "#141416",
          border: `1px solid ${highlight ? "#7c5cfc35" : "#222226"}`,
          paddingTop: "72%",
          position: "relative",
          boxShadow: highlight ? "0 0 15px -4px #7c5cfc25" : "none",
        }}
      >
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={value}
              initial={{ y: "-40%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "40%", opacity: 0 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="font-black tabular-nums"
              style={{
                fontSize: "clamp(18px, 6vw, 28px)",
                color: highlight ? "#a78bfa" : "#ffffff",
                lineHeight: 1,
              }}
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <span className="mt-1 text-[9px] font-bold uppercase tracking-wider" style={{ color: "#777780" }}>
        {label}
      </span>
    </div>
  );
}

export function CountdownClock({
  targetDate,
  startDate,
  title,
  stake,
  status,
  onMarkAchieved,
  onEdit,
  onMarkFailed,
  onNewChallenge,
}: CountdownClockProps) {
  const [time, setTime] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [done, setDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate, done]);

  const pad = (n: number) => String(n).padStart(2, "0");

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
    <div
      className="card p-4 space-y-3.5 relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #131317, #0c0c0e)",
        border: "1px solid rgba(255, 255, 255, 0.09)",
        boxShadow: "0 12px 30px -10px rgba(0, 0, 0, 0.7)",
      }}
    >
      {/* Top row: Status badge, Title, Expand toggle, 3-dots Menu */}
      <div className="flex items-center justify-between gap-2 relative">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="shrink-0 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1"
            style={{
              background: status === "active" ? "rgba(34, 197, 94, 0.15)" : status === "achieved" ? "#0d1a10" : "#1a0d0d",
              color: status === "active" ? "#22c55e" : status === "achieved" ? "#22c55e" : "#ef4444",
              border: `1px solid ${status !== "failed" ? "rgba(34, 197, 94, 0.3)" : "#ef444430"}`,
            }}
          >
            {status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            {status === "active" ? "Live Target" : status}
          </span>
          <h2 className="font-bold text-sm leading-tight truncate" style={{ color: "#ffffff" }}>
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "rgba(255, 255, 255, 0.05)", color: "#888" }}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* 3-Dots Menu Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: menuOpen ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                color: "#ccc",
              }}
              title="Challenge Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-8 z-50 w-48 rounded-2xl p-1.5 backdrop-blur-xl space-y-1 shadow-2xl"
                    style={{
                      background: "rgba(22, 23, 28, 0.97)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                    }}
                  >
                    {onMarkAchieved && (
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); onMarkAchieved(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left"
                        style={{ color: "#22c55e", background: "rgba(34, 197, 94, 0.08)" }}
                      >
                        <Check className="w-3.5 h-3.5" /> Mark as Achieved
                      </button>
                    )}
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); onEdit(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left"
                        style={{ color: "#e2e8f0" }}
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-400" /> Edit Target / Bet
                      </button>
                    )}
                    {onNewChallenge && (
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); onNewChallenge(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left"
                        style={{ color: "#e2e8f0" }}
                      >
                        <Plus className="w-3.5 h-3.5 text-gray-400" /> New Challenge
                      </button>
                    )}
                    {onMarkFailed && (
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); onMarkFailed(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left"
                        style={{ color: "#ef4444" }}
                      >
                        <X className="w-3.5 h-3.5" /> Mark as Failed
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Expandable Countdown Body */}
      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3.5 overflow-hidden"
          >
            {/* 4-digit live countdown with ticking seconds */}
            <div className="grid grid-cols-4 gap-2">
              <Digit value={String(time.days).padStart(2, "0")} label="Days" />
              <Digit value={pad(time.hours)} label="Hours" />
              <Digit value={pad(time.minutes)} label="Mins" />
              <Digit value={pad(time.seconds)} label="Secs" highlight />
            </div>

            {/* Progress bar + dates */}
            {progressPct != null && startDate && (
              <div className="space-y-1.5">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1c1c22" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #7c5cfc, #22c55e)" }}
                  />
                </div>
                <div className="flex justify-between text-[10px]">
                  <span style={{ color: "#666" }}>{fmtDate(startDate)}</span>
                  <span className="font-bold" style={{ color: "#aaa" }}>{progressPct}% elapsed</span>
                  <span style={{ color: "#666" }}>{fmtDate(targetDate)}</span>
                </div>
              </div>
            )}

            {/* Stake summary pill */}
            <div
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs"
              style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">🎯</span>
                <p className="font-medium truncate" style={{ color: "#d1d5db" }}>{stake}</p>
              </div>
              <span className="text-[10px] font-bold shrink-0" style={{ color: "#22c55e" }}>
                {time.days}d {pad(time.hours)}h remaining
              </span>
            </div>
          </motion.div>
        ) : (
          /* Compact View when collapsed */
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between text-xs pt-1"
          >
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-black tabular-nums text-white text-sm">
                {time.days}d {pad(time.hours)}h {pad(time.minutes)}m {pad(time.seconds)}s
              </span>
            </div>
            <span className="text-[11px] text-gray-400 truncate max-w-[150px]">{stake}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
