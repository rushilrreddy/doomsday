"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCheck, X, ArrowRight } from "lucide-react";

interface CheckinReminderProps {
  onGoToCheckin: () => void;
}

export function CheckinReminder({ onGoToCheckin }: CheckinReminderProps) {
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: "linear-gradient(135deg, #1a1008, #110a1a)",
              border: "1px solid #f5c51825",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#f5c51815" }}
            >
              <ClipboardCheck className="w-4 h-4" style={{ color: "#f5c518" }} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-black" style={{ color: "#f5c518" }}>
                Haven&apos;t checked in today
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#666" }}>
                Log your daily update and keep the streak alive
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onGoToCheckin}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold"
                style={{ background: "#f5c51820", color: "#f5c518", border: "1px solid #f5c51830" }}
              >
                Check in <ArrowRight className="w-3 h-3" />
              </motion.button>
              <button onClick={() => setDismissed(true)} className="p-1">
                <X className="w-3.5 h-3.5" style={{ color: "#444" }} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
