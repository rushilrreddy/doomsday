"use client";

import React from "react";
import { motion } from "framer-motion";
import { Streak, User } from "@/lib/types";

interface StreakDisplayProps {
  streaks: Streak[];
  users: User[];
  currentUser: User;
}

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  pruthvi: "#7c5cfc",
  kevin: "#f5c518",
};

const CREW = ["rushil", "pruthvi", "kevin"];

export function StreakDisplay({ streaks, users }: StreakDisplayProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>Streaks</h2>
        <span className="section-title">Active days</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {CREW.map((uname) => {
          const u = users.find((usr) => usr.username.toLowerCase() === uname);
          const s = streaks.find((st) => st.user_id === u?.id);
          const current = s?.current_streak || 0;
          const longest = s?.longest_streak || 0;
          const color = USER_COLORS[uname];
          const isActive = current > 0;

          return (
            <motion.div key={uname} whileHover={{ y: -1 }} className="card p-4 flex flex-col gap-3">
              {/* Avatar */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black"
                  style={{ background: isActive ? `${color}18` : "#1c1c1c", color: isActive ? color : "#555" }}>
                  {uname[0].toUpperCase()}
                </div>
                <span className="text-xs font-bold capitalize" style={{ color: "#888" }}>{uname}</span>
              </div>

              {/* Flame & Count */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black" style={{ color: isActive ? color : "#333" }}>
                    {current}
                  </span>
                  <span className="text-xs" style={{ color: isActive ? color : "#333" }}>
                    {isActive ? "🔥" : "—"}
                  </span>
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#444" }}>
                  day streak
                </p>
              </div>

              {/* Best */}
              <div className="pt-2" style={{ borderTop: "1px solid #1a1a1a" }}>
                <p className="text-[10px]" style={{ color: "#444" }}>
                  Best <span style={{ color: "#666", fontWeight: 700 }}>{longest}d</span>
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
