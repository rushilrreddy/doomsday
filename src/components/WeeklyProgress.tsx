"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { User, Task } from "@/lib/types";
import { BarChart2 } from "lucide-react";

interface WeeklyProgressProps {
  users: User[];
  tasks: Task[];
}

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  pruthvi: "#7c5cfc",
  kevin: "#f5c518",
};

const CREW = ["rushil", "pruthvi", "kevin"];

function getLast7Days(): { label: string; dateStr: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString("en", { weekday: "short" }).slice(0, 1),
      dateStr: d.toISOString().split("T")[0],
    };
  });
}

export function WeeklyProgress({ users, tasks }: WeeklyProgressProps) {
  const days = getLast7Days();

  const data = useMemo(() => {
    return days.map((day) => {
      const perUser = CREW.map((uname) => {
        const u = users.find((usr) => usr.username.toLowerCase() === uname);
        if (!u) return { uname, pct: 0 };
        const dayTasks = tasks.filter((t) => t.user_id === u.id && t.task_date === day.dateStr);
        const pct = dayTasks.length > 0 ? (dayTasks.filter((t) => t.is_done).length / dayTasks.length) : 0;
        return { uname, pct };
      });
      return { ...day, perUser };
    });
  }, [days, users, tasks]);

  // Find max for scaling (at least 1 so no division by zero)
  const maxPct = Math.max(1, ...data.flatMap((d) => d.perUser.map((u) => u.pct)));
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4" style={{ color: "#555" }} />
        <span className="font-bold text-sm" style={{ color: "#f0f0f0" }}>Weekly Progress</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        {CREW.map((uname) => (
          <div key={uname} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: USER_COLORS[uname] }} />
            <span className="text-[10px] font-semibold capitalize" style={{ color: "#555" }}>{uname}</span>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-24">
        {data.map((day, di) => {
          const isToday = day.dateStr === todayStr;
          return (
            <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1">
              {/* Stacked bars per user */}
              <div className="flex gap-0.5 items-end h-16 w-full">
                {day.perUser.map((u, ui) => {
                  const height = Math.round((u.pct / maxPct) * 64);
                  return (
                    <motion.div
                      key={u.uname}
                      className="flex-1 rounded-t-sm"
                      style={{ background: USER_COLORS[u.uname] }}
                      initial={{ height: 0 }}
                      animate={{ height: Math.max(height, u.pct > 0 ? 3 : 0) }}
                      transition={{ duration: 0.5, delay: di * 0.04 + ui * 0.02, ease: "easeOut" }}
                    />
                  );
                })}
              </div>

              {/* Day label */}
              <span
                className="text-[10px] font-bold"
                style={{ color: isToday ? "#f0f0f0" : "#444" }}
              >
                {day.label}
              </span>

              {/* Today dot */}
              {isToday && (
                <div className="w-1 h-1 rounded-full" style={{ background: "#f0f0f0" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
