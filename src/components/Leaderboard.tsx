"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Task, Streak } from "@/lib/types";
import { Trophy, TrendingUp, Flame } from "lucide-react";

interface LeaderboardProps {
  users: User[];
  tasks: Task[];
  streaks: Streak[];
}

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  alan: "#7c5cfc",
  kevin: "#f5c518",
};

const CREW = ["rushil", "alan", "kevin"];

export function Leaderboard({ users, tasks, streaks }: LeaderboardProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const scores = CREW.map((uname) => {
    const u = users.find((u) => u.username.toLowerCase() === uname);
    if (!u) return { uname, tasksDone: 0, streak: 0, score: 0 };
    const todayTasks = tasks.filter((t) => t.user_id === u.id && t.task_date === todayStr);
    const tasksDone = todayTasks.filter((t) => t.is_done).length;
    const streak = streaks.find((s) => s.user_id === u.id)?.current_streak || 0;
    const score = tasksDone * 10 + streak * 5;
    return { uname, tasksDone, streak, score, total: todayTasks.length };
  }).sort((a, b) => b.score - a.score);

  const medals = ["🥇", "🥈", "🥉"];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card p-4 space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" style={{ color: "#f5c518" }} />
          <span className="font-bold text-sm" style={{ color: "#f0f0f0" }}>Leaderboard</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: "#555" }}>
            {scores[0]?.uname ? `${scores[0].uname} is leading` : "Crew Standings"}
          </span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <TrendingUp className="w-4 h-4" style={{ color: "#555" }} />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-2"
          >
            {scores.map((s, i) => {
              const color = USER_COLORS[s.uname] || "#888";
              const total = s.total ?? 0;
              const pct = total > 0 ? Math.round((s.tasksDone / total) * 100) : 0;
              return (
                <motion.div
                  key={s.uname}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{
                    background: i === 0 ? `${color}0d` : "#1c1c1c",
                    border: `1px solid ${i === 0 ? `${color}20` : "#222"}`,
                  }}
                >
                  <span className="text-base">{medals[i]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold capitalize" style={{ color: "#f0f0f0" }}>
                        {s.uname}
                      </span>
                      <span className="text-xs font-bold tabular-nums" style={{ color }}>
                        {s.score}pts
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "#222" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "#555" }}>
                    <Flame className="w-3 h-3" />
                    <span>{s.streak}</span>
                  </div>
                </motion.div>
              );
            })}
            <p className="text-center text-[10px] pt-1" style={{ color: "#333" }}>
              Score = tasks done × 10 + streak days × 5
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
