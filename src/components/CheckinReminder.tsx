"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCheck, X, ArrowRight, Flame } from "lucide-react";

interface CheckinReminderProps {
  onGoToCheckin: () => void;
  hasCheckedInToday?: boolean;
}

export function CheckinReminder({ onGoToCheckin, hasCheckedInToday = false }: CheckinReminderProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isPast7PM, setIsPast7PM] = useState(false);

  useEffect(() => {
    const checkHour = () => {
      const h = new Date().getHours();
      setIsPast7PM(h >= 19); // 7:00 PM onwards
    };
    checkHour();
    const timer = setInterval(checkHour, 60000);
    return () => clearInterval(timer);
  }, []);

  // Only show after 7:00 PM if user has not checked in today
  if (!isPast7PM || hasCheckedInToday || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <div
          className="rounded-2xl p-3.5 flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg, #241406, #160c1c)",
            border: "1px solid rgba(245, 197, 24, 0.35)",
            boxShadow: "0 0 20px -5px rgba(245, 197, 24, 0.2)",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(245, 197, 24, 0.15)", border: "1px solid rgba(245, 197, 24, 0.3)" }}
          >
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-black" style={{ color: "#fbbf24" }}>
                Evening Check-in Pending
              </p>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">
                After 7 PM
              </span>
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: "#9ca3af" }}>
              Submit daily update before midnight to protect your streak 🔥
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onGoToCheckin}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-transform"
              style={{ background: "#f5c518", color: "#000" }}
            >
              Check in <ArrowRight className="w-3 h-3" />
            </motion.button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              title="Dismiss for now"
            >
              <X className="w-3.5 h-3.5" style={{ color: "#777" }} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
