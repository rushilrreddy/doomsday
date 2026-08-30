"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Task } from "@/lib/types";

interface TodaySummaryProps {
  users: User[];
  tasks: Task[];
  currentUser: User;
}

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  pruthvi: "#7c5cfc",
  kevin: "#f5c518",
};

const CREW = ["rushil", "pruthvi", "kevin"];

export function TodaySummary({ users, tasks }: TodaySummaryProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div
      className="flex gap-3 p-4 rounded-2xl overflow-x-auto"
      style={{ background: "#111", border: "1px solid #1a1a1a" }}
    >
      {CREW.map((uname, i) => {
        const u = users.find((usr) => usr.username.toLowerCase() === uname);
        const todayTasks = tasks.filter((t) => t.user_id === u?.id && t.task_date === todayStr);
        const done = todayTasks.filter((t) => t.is_done).length;
        const total = todayTasks.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const color = USER_COLORS[uname];
        const allDone = total > 0 && done === total;

        return (
          <motion.div
            key={uname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex-1 flex flex-col items-center gap-2 min-w-0"
          >
            {/* Circular progress */}
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="#1e1e1e" strokeWidth="3.5" />
                <motion.circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke={color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={125.66}
                  initial={{ strokeDashoffset: 125.66 }}
                  animate={{ strokeDashoffset: 125.66 - (125.66 * pct) / 100 }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.06 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {allDone ? (
                  <span className="text-sm">✅</span>
                ) : (
                  <span className="text-[10px] font-black tabular-nums" style={{ color }}>
                    {pct}%
                  </span>
                )}
              </div>
            </div>

            {/* Name */}
            <span className="text-[10px] font-bold capitalize truncate w-full text-center"
              style={{ color: "#666" }}>
              {uname}
            </span>

            {/* Count */}
            <span className="text-[10px] font-semibold" style={{ color: "#444" }}>
              {done}/{total}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
