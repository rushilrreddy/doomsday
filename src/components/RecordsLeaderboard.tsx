"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { User, Task, StudyLog, Streak, Goal, BodyWeightLog, RoutineLog } from "@/lib/types";
import { calculateUserXP } from "./XPLevelCard";
import { Flame, Trophy, Code2, Clock, CheckSquare, Zap, Crown } from "lucide-react";

interface RecordsLeaderboardProps {
  users: User[];
  tasks: Task[];
  studyLogs: StudyLog[];
  streaks: Streak[];
  goals: Goal[];
  weightLogs?: BodyWeightLog[];
  routineLogs?: RoutineLog[];
}

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  pruthvi: "#7c5cfc",
  kevin:  "#f5c518",
};

function safeFormatDate(dateStr?: string) {
  if (!dateStr || dateStr === "—") return "";
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function RecordsLeaderboard({
  users = [],
  tasks = [],
  studyLogs = [],
  streaks = [],
  goals = [],
  weightLogs = [],
  routineLogs = [],
}: RecordsLeaderboardProps) {
  const records = useMemo(() => {
    const safeUsers = users || [];
    const safeTasks = tasks || [];
    const safeStudy = studyLogs || [];
    const safeStreaks = streaks || [];
    const safeGoals = goals || [];
    const safeWeight = weightLogs || [];
    const safeRoutines = routineLogs || [];

    // 1. Most DSA problems in a single day
    const dsaByDayUser: Record<string, { problems: number; userId: string; date: string }> = {};
    safeStudy.filter((l) => l && l.category === "dsa").forEach((l) => {
      const key = `${l.user_id}_${l.log_date}`;
      if (!dsaByDayUser[key]) dsaByDayUser[key] = { problems: 0, userId: l.user_id, date: l.log_date };
      dsaByDayUser[key].problems += (l.problems_solved || 0);
    });
    const maxDSADay = Object.values(dsaByDayUser).sort((a, b) => b.problems - a.problems)[0] || {
      problems: 0, userId: safeUsers[0]?.id || "", date: "—"
    };

    // 2. Longest task streak ever
    const maxStreak = [...safeStreaks].sort((a, b) => (b?.longest_streak || 0) - (a?.longest_streak || 0))[0] || {
      longest_streak: 0, user_id: safeUsers[0]?.id || ""
    };

    // 3. Most study hours all-time
    const studyByUser = safeUsers.map((u) => ({
      user: u,
      minutes: safeStudy.filter((l) => l && l.user_id === u.id).reduce((acc, l) => acc + (l.duration_minutes || 0), 0),
    })).sort((a, b) => b.minutes - a.minutes)[0] || { user: safeUsers[0], minutes: 0 };

    // 4. Most tasks completed in a single day
    const tasksByDayUser: Record<string, { count: number; userId: string; date: string }> = {};
    safeTasks.filter((t) => t && t.is_done && t.task_date).forEach((t) => {
      const key = `${t.user_id}_${t.task_date}`;
      if (!tasksByDayUser[key]) tasksByDayUser[key] = { count: 0, userId: t.user_id, date: t.task_date! };
      tasksByDayUser[key].count++;
    });
    const maxTaskDay = Object.values(tasksByDayUser).sort((a, b) => b.count - a.count)[0] || {
      count: 0, userId: safeUsers[0]?.id || "", date: "—"
    };

    // 5. Total XP Leader
    const xpLeaders = safeUsers.map((u) => ({
      user: u,
      xpData: calculateUserXP(u.id, safeTasks, safeStudy, safeStreaks, safeGoals, safeWeight, safeRoutines),
    })).sort((a, b) => (b?.xpData?.xp || 0) - (a?.xpData?.xp || 0))[0] || { user: safeUsers[0], xpData: { xp: 0, level: 1 } };

    return [
      {
        id: "dsa_day",
        title: "Most DSA in 1 Day",
        value: `${maxDSADay.problems} problems`,
        holder: safeUsers.find((u) => u.id === maxDSADay.userId)?.username || "—",
        subtext: safeFormatDate(maxDSADay.date),
        icon: Code2,
        color: "#7c5cfc",
      },
      {
        id: "streak_record",
        title: "Longest Task Streak",
        value: `${maxStreak.longest_streak || 0} days`,
        holder: safeUsers.find((u) => u.id === maxStreak.user_id)?.username || "—",
        subtext: "All-time best",
        icon: Flame,
        color: "#f59e0b",
      },
      {
        id: "xp_king",
        title: "XP Crew Leader",
        value: `${(xpLeaders?.xpData?.xp || 0).toLocaleString()} XP`,
        holder: xpLeaders?.user?.username || "—",
        subtext: `Level ${xpLeaders?.xpData?.level || 1}`,
        icon: Crown,
        color: "#22c55e",
      },
      {
        id: "study_hours",
        title: "Total Study Time",
        value: `${Math.round((studyByUser?.minutes || 0) / 60)} hours`,
        holder: studyByUser?.user?.username || "—",
        subtext: "All-time logged",
        icon: Clock,
        color: "#38bdf8",
      },
      {
        id: "tasks_day",
        title: "Most Tasks in 1 Day",
        value: `${maxTaskDay.count} tasks`,
        holder: safeUsers.find((u) => u.id === maxTaskDay.userId)?.username || "—",
        subtext: safeFormatDate(maxTaskDay.date),
        icon: CheckSquare,
        color: "#ec4899",
      },
    ];
  }, [users, tasks, studyLogs, streaks, goals]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4" style={{ color: "#f5c518" }} />
        <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>All-Time Records</h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {records.map((rec) => {
          const Icon = rec.icon;
          const userColor = USER_COLORS[rec.holder.toLowerCase()] || "#888";
          return (
            <motion.div
              key={rec.id}
              whileHover={{ scale: 1.02 }}
              className="card p-3.5 space-y-2 relative overflow-hidden"
              style={{ background: "#141414", border: "1px solid #222" }}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: `${rec.color}18`, color: rec.color }}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full"
                  style={{ background: `${userColor}18`, color: userColor }}>
                  {rec.holder}
                </span>
              </div>

              <div>
                <p className="text-base font-black tabular-nums leading-tight" style={{ color: "#f0f0f0" }}>
                  {rec.value}
                </p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: "#666" }}>
                  {rec.title} {rec.subtext ? `· ${rec.subtext}` : ""}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
