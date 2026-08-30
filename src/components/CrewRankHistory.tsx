"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { User, Task, StudyLog } from "@/lib/types";
import { TrendingUp, Award } from "lucide-react";

interface CrewRankHistoryProps {
  users: User[];
  tasks: Task[];
  studyLogs: StudyLog[];
}

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  pruthvi: "#7c5cfc",
  kevin:  "#f5c518",
};

export function CrewRankHistory({ users = [], tasks = [], studyLogs = [] }: CrewRankHistoryProps) {
  // Generate the last 6 weeks (Monday to Sunday)
  const history = useMemo(() => {
    const safeUsers = users || [];
    const safeTasks = tasks || [];
    const safeStudy = studyLogs || [];

    const weeks: Array<{
      weekLabel: string;
      winner: User | null;
      scores: Record<string, number>;
    }> = [];

    const now = new Date();
    for (let w = 5; w >= 0; w--) {
      const mon = new Date(now);
      const day = mon.getDay() === 0 ? -6 : 1 - mon.getDay();
      mon.setDate(mon.getDate() + day - w * 7);
      mon.setHours(0, 0, 0, 0);

      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      sun.setHours(23, 59, 59, 999);

      const monStr = mon.toISOString().split("T")[0];
      const sunStr = sun.toISOString().split("T")[0];

      let weekLabel = "";
      try {
        weekLabel = mon.toLocaleDateString("en", { month: "short", day: "numeric" });
      } catch {
        weekLabel = `Wk -${w}`;
      }

      const scores: Record<string, number> = {};
      safeUsers.forEach((u) => {
        if (!u) return;
        const uTasks = safeTasks.filter((t) => t && t.user_id === u.id && t.is_done && t.task_date && t.task_date >= monStr && t.task_date <= sunStr).length;
        const uProblems = safeStudy
          .filter((l) => l && l.user_id === u.id && l.category === "dsa" && l.log_date >= monStr && l.log_date <= sunStr)
          .reduce((acc, l) => acc + (l.problems_solved || 0), 0);
        scores[u.id] = uTasks * 5 + uProblems * 10;
      });

      let winnerId: string | null = null;
      let maxScore = -1;
      Object.entries(scores).forEach(([uid, sc]) => {
        if (sc > maxScore && sc > 0) {
          maxScore = sc;
          winnerId = uid;
        }
      });

      const winner = winnerId ? safeUsers.find((u) => u && u.id === winnerId) || null : null;
      weeks.push({ weekLabel, winner, scores });
    }

    return weeks;
  }, [users, tasks, studyLogs]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: "#7c5cfc" }} />
          <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>Rank History</h2>
        </div>
        <span className="text-[10px] font-bold" style={{ color: "#555" }}>Last 6 Weeks</span>
      </div>

      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-6 gap-1 text-center">
          {history.map((w, idx) => {
            const isCurrent = idx === history.length - 1;
            const winnerColor = w.winner ? USER_COLORS[w.winner.username.toLowerCase()] || "#888" : "#444";

            return (
              <div key={w.weekLabel} className="space-y-2 flex flex-col items-center">
                {/* Winner Crown Node */}
                <div
                  className="w-10 h-10 rounded-2xl flex flex-col items-center justify-center relative transition-all"
                  style={{
                    background: w.winner ? `${winnerColor}18` : "#161616",
                    border: isCurrent ? `1.5px solid ${winnerColor}` : `1px solid ${w.winner ? winnerColor + "35" : "#222"}`,
                  }}
                >
                  {w.winner ? (
                    <>
                      <span className="text-xs font-black capitalize leading-none" style={{ color: winnerColor }}>
                        {w.winner.username.slice(0, 3)}
                      </span>
                      <Award className="w-2.5 h-2.5 mt-0.5" style={{ color: winnerColor }} />
                    </>
                  ) : (
                    <span className="text-[10px]" style={{ color: "#333" }}>—</span>
                  )}
                </div>

                {/* Week Label */}
                <div>
                  <p className="text-[9px] font-bold" style={{ color: isCurrent ? "#f0f0f0" : "#555" }}>
                    {isCurrent ? "This Wk" : w.weekLabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-[#1c1c1c] flex items-center justify-between text-[10px]" style={{ color: "#666" }}>
          <span>#1 rank based on tasks + DSA solved that week</span>
          <span className="font-semibold" style={{ color: "#888" }}>Weekly resets Mon</span>
        </div>
      </div>
    </div>
  );
}
