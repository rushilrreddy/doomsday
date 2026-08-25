"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { User, Task, StudyLog } from "@/lib/types";
import { BarChart3, PieChart, Target, CheckCircle2, TrendingUp, Sparkles, Clock } from "lucide-react";

interface AnalyticsDashboardProps {
  currentUser: User;
  users: User[];
  tasks: Task[];
  studyLogs: StudyLog[];
}

const DIFF_COLORS = {
  easy:   { bg: "#22c55e", label: "Easy"   },
  medium: { bg: "#f59e0b", label: "Medium" },
  hard:   { bg: "#ef4444", label: "Hard"   },
  other:  { bg: "#7c5cfc", label: "Other"  },
};

export function AnalyticsDashboard({ currentUser, users = [], tasks = [], studyLogs = [] }: AnalyticsDashboardProps) {
  const safeUsers = users || [];
  const safeTasks = tasks || [];
  const safeStudy = studyLogs || [];

  const [selectedUser, setSelectedUser] = useState<string>(currentUser?.id || "");
  const [targetGoalProblems, setTargetGoalProblems] = useState<number>(100);

  const activeUser = safeUsers.find((u) => u && u.id === selectedUser) || currentUser;

  // 1. 12-Week Study Hours
  const weeklyStudyHours = useMemo(() => {
    const weeks: Array<{ label: string; hours: number }> = [];
    const now = new Date();
    if (!activeUser) return weeks;

    for (let i = 11; i >= 0; i--) {
      const mon = new Date(now);
      const day = mon.getDay() === 0 ? -6 : 1 - mon.getDay();
      mon.setDate(mon.getDate() + day - i * 7);
      mon.setHours(0, 0, 0, 0);

      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      sun.setHours(23, 59, 59, 999);

      const monStr = mon.toISOString().split("T")[0];
      const sunStr = sun.toISOString().split("T")[0];

      const mins = safeStudy
        .filter((l) => l && l.user_id === activeUser.id && l.log_date >= monStr && l.log_date <= sunStr)
        .reduce((acc, l) => acc + (l.duration_minutes || 0), 0);

      let label = "";
      try {
        label = `${mon.toLocaleDateString("en", { month: "numeric", day: "numeric" })}`;
      } catch {
        label = `Wk -${i}`;
      }
      weeks.push({ label, hours: Math.round((mins / 60) * 10) / 10 });
    }
    return weeks;
  }, [safeStudy, activeUser]);

  const maxWeeklyHours = Math.max(...weeklyStudyHours.map((w) => w.hours), 5);

  // 2. DSA Difficulty Breakdown
  const difficultyStats = useMemo(() => {
    if (!activeUser) return { counts: { easy: 0, medium: 0, hard: 0, other: 0 }, total: 0, pcts: { easy: 0, medium: 0, hard: 0, other: 0 } };
    const userDSA = safeStudy.filter((l) => l && l.user_id === activeUser.id && l.category === "dsa");
    const counts = { easy: 0, medium: 0, hard: 0, other: 0 };

    userDSA.forEach((l) => {
      const diff = (l.difficulty || "other").toLowerCase() as keyof typeof counts;
      if (counts[diff] !== undefined) counts[diff] += (l.problems_solved || 0);
      else counts.other += (l.problems_solved || 0);
    });

    const total = counts.easy + counts.medium + counts.hard + counts.other;

    return {
      counts,
      total,
      pcts: {
        easy:   total > 0 ? Math.round((counts.easy / total) * 100) : 0,
        medium: total > 0 ? Math.round((counts.medium / total) * 100) : 0,
        hard:   total > 0 ? Math.round((counts.hard / total) * 100) : 0,
        other:  total > 0 ? Math.round((counts.other / total) * 100) : 0,
      },
    };
  }, [safeStudy, activeUser]);

  // 3. Predicted Completion Calculator
  const prediction = useMemo(() => {
    if (!activeUser) return { dailyPace: 0, totalSolved: 0, remaining: 0, daysNeeded: 0, etaDate: "—" };
    const today = new Date();
    const d14Ago = new Date();
    d14Ago.setDate(d14Ago.getDate() - 14);
    const d14Str = d14Ago.toISOString().split("T")[0];

    const past14Problems = safeStudy
      .filter((l) => l && l.user_id === activeUser.id && l.category === "dsa" && l.log_date >= d14Str)
      .reduce((acc, l) => acc + (l.problems_solved || 0), 0);

    const totalSolved = safeStudy
      .filter((l) => l && l.user_id === activeUser.id && l.category === "dsa")
      .reduce((acc, l) => acc + (l.problems_solved || 0), 0);

    const dailyPace = Math.max(0.2, past14Problems / 14);
    const remaining = Math.max(0, targetGoalProblems - totalSolved);
    const daysNeeded = Math.ceil(remaining / dailyPace);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysNeeded);

    let etaDate = "";
    try {
      etaDate = targetDate.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      etaDate = `in ${daysNeeded} days`;
    }

    return {
      dailyPace: Math.round(dailyPace * 10) / 10,
      totalSolved,
      remaining,
      daysNeeded,
      etaDate,
    };
  }, [safeStudy, activeUser, targetGoalProblems]);

  // 4. 30-Day Task Completion Rate & Improvement
  const taskRateStats = useMemo(() => {
    if (!activeUser) return { currentRate: 0, currentDone: 0, totalTasks: 0, delta: 0 };
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
    const d60 = new Date(now.getTime() - 60 * 86400000).toISOString().split("T")[0];

    const currentPeriodTasks = safeTasks.filter((t) => t && t.user_id === activeUser.id && t.task_date >= d30);
    const prevPeriodTasks = safeTasks.filter((t) => t && t.user_id === activeUser.id && t.task_date >= d60 && t.task_date < d30);

    const currentDone = currentPeriodTasks.filter((t) => t.is_done).length;
    const currentRate = currentPeriodTasks.length > 0 ? Math.round((currentDone / currentPeriodTasks.length) * 100) : 0;

    const prevDone = prevPeriodTasks.filter((t) => t.is_done).length;
    const prevRate = prevPeriodTasks.length > 0 ? Math.round((prevDone / prevPeriodTasks.length) * 100) : currentRate;

    const delta = currentRate - prevRate;

    return {
      currentRate,
      currentDone,
      totalTasks: currentPeriodTasks.length,
      delta,
    };
  }, [safeTasks, activeUser]);

  return (
    <div className="space-y-4">
      {/* Header + User Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" style={{ color: "#22c55e" }} />
          <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>Analytics</h2>
        </div>

        {/* User Pill Switcher */}
        <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: "#111", border: "1px solid #222" }}>
          {users.map((u) => {
            const active = u.id === selectedUser;
            return (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u.id)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all"
                style={{
                  background: active ? "#222" : "transparent",
                  color: active ? "#f0f0f0" : "#555",
                }}
              >
                {u.username}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. 12-Week Study Hours Chart */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black" style={{ color: "#f0f0f0" }}>Study Hours (Last 12 Weeks)</p>
            <p className="text-[10px]" style={{ color: "#555" }}>Weekly hours trend</p>
          </div>
          <Clock className="w-3.5 h-3.5" style={{ color: "#7c5cfc" }} />
        </div>

        <div className="h-32 flex items-end justify-between gap-1.5 pt-4">
          {weeklyStudyHours.map((w, idx) => {
            const heightPct = Math.max(8, (w.hours / maxWeeklyHours) * 100);
            const isCurrent = idx === weeklyStudyHours.length - 1;

            return (
              <div key={w.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 px-2 py-0.5 rounded text-[9px] font-bold pointer-events-none z-10 whitespace-nowrap"
                  style={{ background: "#222", color: "#f0f0f0" }}>
                  {w.hours}h
                </div>

                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.02 }}
                  className="w-full rounded-t-md transition-colors"
                  style={{
                    background: isCurrent ? "#7c5cfc" : w.hours > 0 ? "#7c5cfc40" : "#1c1c1c",
                  }}
                />
                <span className="text-[8px] font-semibold truncate" style={{ color: isCurrent ? "#7c5cfc" : "#444" }}>
                  {w.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 30-Day Task Completion Rate */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card p-3.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider" style={{ color: "#555" }}>30D TASK RATE</span>
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
          </div>
          <p className="text-2xl font-black tabular-nums" style={{ color: "#22c55e" }}>
            {taskRateStats.currentRate}%
          </p>
          <div className="flex items-center gap-1 text-[10px]">
            <TrendingUp className="w-3 h-3" style={{ color: taskRateStats.delta >= 0 ? "#22c55e" : "#ef4444" }} />
            <span style={{ color: taskRateStats.delta >= 0 ? "#22c55e" : "#ef4444" }}>
              {taskRateStats.delta >= 0 ? `+${taskRateStats.delta}%` : `${taskRateStats.delta}%`} vs prev month
            </span>
          </div>
        </div>

        <div className="card p-3.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider" style={{ color: "#555" }}>SOLVED DSA</span>
            <Target className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
          </div>
          <p className="text-2xl font-black tabular-nums" style={{ color: "#f59e0b" }}>
            {difficultyStats.total}
          </p>
          <p className="text-[10px]" style={{ color: "#666" }}>
            {prediction.dailyPace} problems / day pace
          </p>
        </div>
      </div>

      {/* 3. DSA Difficulty Breakdown */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black" style={{ color: "#f0f0f0" }}>DSA Difficulty Distribution</p>
            <p className="text-[10px]" style={{ color: "#555" }}>{difficultyStats.total} total problems solved</p>
          </div>
          <PieChart className="w-3.5 h-3.5" style={{ color: "#555" }} />
        </div>

        {/* Progress bar stack */}
        <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "#1c1c1c" }}>
          {difficultyStats.pcts.easy > 0 && (
            <div style={{ width: `${difficultyStats.pcts.easy}%`, background: DIFF_COLORS.easy.bg }} title="Easy" />
          )}
          {difficultyStats.pcts.medium > 0 && (
            <div style={{ width: `${difficultyStats.pcts.medium}%`, background: DIFF_COLORS.medium.bg }} title="Medium" />
          )}
          {difficultyStats.pcts.hard > 0 && (
            <div style={{ width: `${difficultyStats.pcts.hard}%`, background: DIFF_COLORS.hard.bg }} title="Hard" />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="card p-2" style={{ background: "#121212" }}>
            <span className="text-[10px] font-bold" style={{ color: DIFF_COLORS.easy.bg }}>Easy</span>
            <p className="text-sm font-black tabular-nums" style={{ color: "#f0f0f0" }}>
              {difficultyStats.counts.easy} <span className="text-[9px] font-normal" style={{ color: "#666" }}>({difficultyStats.pcts.easy}%)</span>
            </p>
          </div>
          <div className="card p-2" style={{ background: "#121212" }}>
            <span className="text-[10px] font-bold" style={{ color: DIFF_COLORS.medium.bg }}>Medium</span>
            <p className="text-sm font-black tabular-nums" style={{ color: "#f0f0f0" }}>
              {difficultyStats.counts.medium} <span className="text-[9px] font-normal" style={{ color: "#666" }}>({difficultyStats.pcts.medium}%)</span>
            </p>
          </div>
          <div className="card p-2" style={{ background: "#121212" }}>
            <span className="text-[10px] font-bold" style={{ color: DIFF_COLORS.hard.bg }}>Hard</span>
            <p className="text-sm font-black tabular-nums" style={{ color: "#f0f0f0" }}>
              {difficultyStats.counts.hard} <span className="text-[9px] font-normal" style={{ color: "#666" }}>({difficultyStats.pcts.hard}%)</span>
            </p>
          </div>
        </div>
      </div>

      {/* 4. Predicted Completion Pace Calculator */}
      <div className="card p-4 space-y-3"
        style={{ background: "linear-gradient(135deg, #101c13, #161616)", border: "1px solid #22c55e25" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: "#22c55e" }} />
            <p className="text-xs font-black" style={{ color: "#f0f0f0" }}>Target Completion Predictor</p>
          </div>
          {/* Target selector */}
          <div className="flex gap-1">
            {[50, 100, 200, 500].map((num) => (
              <button
                key={num}
                onClick={() => setTargetGoalProblems(num)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                style={{
                  background: targetGoalProblems === num ? "#22c55e" : "#1c1c1c",
                  color: targetGoalProblems === num ? "#000" : "#666",
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold" style={{ color: "#d0d0d0" }}>
            At your current pace of <span style={{ color: "#22c55e" }}>{prediction.dailyPace} problems/day</span>,
            you will reach <span style={{ color: "#f0f0f0" }}>{targetGoalProblems} problems</span> by:
          </p>
          <p className="text-xl font-black" style={{ color: "#22c55e" }}>
            {prediction.remaining === 0 ? "🎯 Target already reached!" : `🗓️ ${prediction.etaDate} (${prediction.daysNeeded} days)`}
          </p>
        </div>
      </div>
    </div>
  );
}
