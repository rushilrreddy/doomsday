"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, Send, Check, Loader2 } from "lucide-react";

export function WeeklyReport() {
  const [loading, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fire on Sunday if not already sent today
  React.useEffect(() => {
    const today = new Date();
    if (today.getDay() !== 0) return; // only Sunday
    const key = `crew_weekly_report_${today.toISOString().split("T")[0]}`;
    if (localStorage.getItem(key)) return;
    fetch("/api/report/weekly", { method: "POST" }).then((r) => {
      if (r.ok) localStorage.setItem(key, "1");
    }).catch(() => {});
  }, []);

  const handleSend = async () => {
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/report/weekly", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch {
      setError("Could not send report");
    } finally { setSending(false); }
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4" style={{ color: "#7c5cfc" }} />
        <p className="font-bold text-sm" style={{ color: "#f0f0f0" }}>Weekly Crew Report</p>
      </div>

      <p className="text-xs" style={{ color: "#555" }}>
        Automatically sent every Sunday evening via push notification. Includes DSA rankings, study time, tasks done, and streaks for the week.
      </p>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleSend}
        disabled={loading || done}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
        style={{
          background: done ? "#0d1a10" : "linear-gradient(135deg, #1a1440, #1c1c1c)",
          border:     `1px solid ${done ? "#22c55e30" : "#7c5cfc30"}`,
          color:      done ? "#22c55e" : "#f0f0f0",
        }}
      >
        {loading ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
        ) : done ? (
          <><Check className="w-3.5 h-3.5" /> Sent to crew!</>
        ) : (
          <><Send className="w-3.5 h-3.5" /> Send Report Now</>
        )}
      </motion.button>

      {error && <p className="text-xs text-center" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}
