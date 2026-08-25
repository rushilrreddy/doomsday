"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Task, RoutineLog, DailyCheckin, Streak, User, StudyLog } from "@/lib/types";

interface StreakCalendarProps {
  users: User[];
  tasks: Task[];
  routineLogs: RoutineLog[];
  checkins: DailyCheckin[];
  studyLogs?: StudyLog[];
  streaks: Streak[];
  currentUser: User;
}

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  alan: "#7c5cfc",
  kevin: "#f5c518",
};
const CREW = ["rushil", "alan", "kevin"];

/** Build a set of active date strings for a given user */
function buildActivitySet(
  userId: string,
  tasks: Task[],
  routineLogs: RoutineLog[],
  checkins: DailyCheckin[],
  studyLogs: StudyLog[] = [],
  streak?: Streak
): Map<string, number> {
  const map = new Map<string, number>();
  const add = (date: string) => map.set(date, (map.get(date) || 0) + 1);
  tasks.filter((t) => t.user_id === userId && t.is_done && t.task_date).forEach((t) => add(t.task_date!));
  routineLogs.filter((l) => l.user_id === userId).forEach((l) => add(l.log_date));
  checkins.filter((c) => c.user_id === userId).forEach((c) => add(c.checkin_date));
  studyLogs.filter((l) => l.user_id === userId).forEach((l) => add(l.log_date));
  (streak?.frozen_dates || []).forEach((d) => add(d));
  return map;
}

/** Get last N days as "YYYY-MM-DD" array, newest last */
function getLastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().split("T")[0];
  });
}

export function StreakCalendar({ users, tasks, routineLogs, checkins, studyLogs = [], streaks, currentUser }: StreakCalendarProps) {
  const [selected, setSelected] = useState(currentUser.username.toLowerCase());
  const color = USER_COLORS[selected] || "#22c55e";

  const selectedUser = users.find((u) => u.username.toLowerCase() === selected);
  const streak = streaks.find((s) => s.user_id === selectedUser?.id);

  // 91 days = 13 weeks
  const days = useMemo(() => getLastNDays(91), []);
  const todayStr = new Date().toISOString().split("T")[0];

  const activityMap = useMemo(
    () => selectedUser ? buildActivitySet(selectedUser.id, tasks, routineLogs, checkins, studyLogs, streak) : new Map(),
    [selectedUser, tasks, routineLogs, checkins, studyLogs, streak]
  );

  // Group by week (7 days per column, starting Monday)
  // We'll display 13 columns × 7 rows
  // Pad start with empty cells so week starts on Mon
  const firstDay = new Date(days[0] + "T12:00:00");
  const dayOfWeek = (firstDay.getDay() + 6) % 7; // 0=Mon
  const paddedDays: (string | null)[] = [
    ...Array(dayOfWeek).fill(null),
    ...days,
  ];
  // Chunk into weeks
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

  const getCell = (dateStr: string | null) => {
    if (!dateStr) return { bg: "transparent", border: "transparent", isToday: false, count: 0 };
    const count = activityMap.get(dateStr) || 0;
    const isToday = dateStr === todayStr;
    let bg = "#1a1a1a";
    if (count >= 1) bg = `${color}30`;
    if (count >= 3) bg = `${color}60`;
    if (count >= 5) bg = color;
    return { bg, border: isToday ? color : "transparent", isToday, count };
  };

  // Calculate active streak from the heatmap
  let calStreak = 0;
  const reverseDays = [...days].reverse();
  for (const d of reverseDays) {
    if (d === todayStr && activityMap.get(d) === 0) continue; // allow today to be 0
    if (activityMap.get(d)) calStreak++;
    else break;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>Streak Calendar</h2>
        <p className="section-title">Last 13 weeks</p>
      </div>

      {/* Friend tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CREW.map((uname) => {
          const c = USER_COLORS[uname];
          const active = selected === uname;
          return (
            <motion.button key={uname} whileTap={{ scale: 0.95 }}
              onClick={() => setSelected(uname)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold capitalize"
              style={{
                background: active ? `${c}15` : "#161616",
                border: active ? `1px solid ${c}35` : "1px solid #222",
                color: active ? c : "#666",
              }}>
              {uname}
            </motion.button>
          );
        })}
      </div>

      {/* Streak badges */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="card p-3.5 text-center space-y-1">
          <p className="text-2xl font-black" style={{ color }}>
            {streak?.current_streak || 0}
            <span className="text-lg ml-1">🔥</span>
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#444" }}>Current streak</p>
        </div>
        <div className="card p-3.5 text-center space-y-1">
          <p className="text-2xl font-black" style={{ color: "#888" }}>
            {streak?.longest_streak || 0}
            <span className="text-lg ml-1">⚡</span>
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#444" }}>Best streak</p>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="card p-4 overflow-x-auto">
        <div className="flex gap-1.5" style={{ minWidth: "fit-content" }}>
          {/* Day labels column */}
          <div className="flex flex-col gap-1 mr-1" style={{ paddingTop: 20 }}>
            {DAY_LABELS.map((l, i) => (
              <div key={i} className="w-4 h-4 flex items-center justify-center">
                <span className="text-[8px] font-bold" style={{ color: "#333" }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wi) => {
            // Month label: show if the first non-null cell in this week changes month
            const firstDate = week.find((d) => d !== null);
            const prevWeekFirst = wi > 0 ? weeks[wi - 1].find((d) => d !== null) : null;
            const showMonth = firstDate && (!prevWeekFirst ||
              new Date(firstDate + "T12:00:00").getMonth() !== new Date(prevWeekFirst + "T12:00:00").getMonth());
            const monthLabel = firstDate
              ? new Date(firstDate + "T12:00:00").toLocaleDateString("en", { month: "short" })
              : "";

            return (
              <div key={wi} className="flex flex-col gap-1">
                {/* Month label */}
                <div className="h-4 flex items-end">
                  {showMonth && (
                    <span className="text-[8px] font-bold" style={{ color: "#444" }}>{monthLabel}</span>
                  )}
                </div>
                {week.map((dateStr, di) => {
                  if (!dateStr) {
                    return <div key={di} className="w-4 h-4 rounded-sm" style={{ opacity: 0 }} />;
                  }
                  const { bg, border, isToday, count } = getCell(dateStr);
                  return (
                    <motion.div
                      key={di}
                      whileHover={{ scale: 1.3 }}
                      className="w-4 h-4 rounded-sm relative flex items-center justify-center"
                      style={{
                        background: bg,
                        border: `1px solid ${border}`,
                        outline: isToday ? `2px solid ${color}` : "none",
                        outlineOffset: isToday ? 1 : 0,
                      }}
                      title={`${dateStr}: ${count} activities`}
                    >
                      {count > 0 && (
                        <span style={{ fontSize: 8, lineHeight: 1 }}>🔥</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[9px]" style={{ color: "#444" }}>Less</span>
          {[0, 1, 3, 5].map((n) => (
            <div key={n} className="w-3 h-3 rounded-sm"
              style={{
                background: n === 0 ? "#1a1a1a" : n === 1 ? `${color}30` : n === 3 ? `${color}60` : color,
              }} />
          ))}
          <span className="text-[9px]" style={{ color: "#444" }}>More</span>
        </div>
      </div>
    </div>
  );
}
