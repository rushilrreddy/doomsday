"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Task, StudyLog, Streak, Goal } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Zap, ShieldAlert, Snowflake, Trophy, Sparkles, ChevronRight, Check } from "lucide-react";

interface XPLevelCardProps {
  currentUser: User;
  tasks: Task[];
  studyLogs: StudyLog[];
  streaks: Streak[];
  goals: Goal[];
  onRefresh: () => void;
}

const LEVEL_TIERS = [
  { minLevel: 1,  title: "Novice",            color: "#888888", icon: "🌱" },
  { minLevel: 5,  title: "Apprentice",        color: "#22c55e", icon: "⚡" },
  { minLevel: 10, title: "Code Grinder",      color: "#3b82f6", icon: "💻" },
  { minLevel: 20, title: "Study Machine",     color: "#7c5cfc", icon: "🧠" },
  { minLevel: 35, title: "Elite Doomsdayer",  color: "#f59e0b", icon: "🔥" },
  { minLevel: 50, title: "Legendary Survivor",color: "#ef4444", icon: "👑" },
];

export function calculateUserXP(
  userId: string,
  tasks: Task[],
  studyLogs: StudyLog[],
  streaks: Streak[],
  goals: Goal[]
): { xp: number; level: number; currentLevelMinXP: number; nextLevelXP: number; progressPct: number; tier: typeof LEVEL_TIERS[0] } {
  const userTasks = tasks.filter((t) => t.user_id === userId && t.is_done);
  const userStudy = studyLogs.filter((l) => l.user_id === userId);
  const userStreak = streaks.find((s) => s.user_id === userId);
  const userGoals = goals.filter((g) => g.winner_id === userId && g.status === "achieved");

  // XP Breakdown:
  // 10 XP per task done
  // 15 XP per DSA problem solved
  // 1 XP per study minute
  // 250 XP per Goal achieved
  // 50 XP per streak day (longest streak)
  const taskXP = userTasks.length * 10;
  const dsaXP = userStudy.filter((l) => l.category === "dsa").reduce((acc, l) => acc + l.problems_solved * 15, 0);
  const studyMinsXP = userStudy.reduce((acc, l) => acc + l.duration_minutes, 0);
  const goalXP = userGoals.length * 250;
  const streakXP = (userStreak?.longest_streak || 0) * 50;

  const totalXP = taskXP + dsaXP + studyMinsXP + goalXP + streakXP;

  // Level curve: Level L requires 100 * (L-1)^1.6 XP
  // Approx: level = Math.floor(Math.pow(totalXP / 100, 1 / 1.6)) + 1
  let level = 1;
  while (Math.floor(100 * Math.pow(level, 1.5)) <= totalXP) {
    level++;
  }

  const currentLevelMinXP = level === 1 ? 0 : Math.floor(100 * Math.pow(level - 1, 1.5));
  const nextLevelXP = Math.floor(100 * Math.pow(level, 1.5));
  const xpInLevel = totalXP - currentLevelMinXP;
  const xpNeeded = nextLevelXP - currentLevelMinXP;
  const progressPct = Math.min(100, Math.max(0, Math.round((xpInLevel / (xpNeeded || 1)) * 100)));

  let tier = LEVEL_TIERS[0];
  for (const t of LEVEL_TIERS) {
    if (level >= t.minLevel) tier = t;
  }

  return {
    xp: totalXP,
    level,
    currentLevelMinXP,
    nextLevelXP,
    progressPct,
    tier,
  };
}

export function XPLevelCard({ currentUser, tasks, studyLogs, streaks, goals, onRefresh }: XPLevelCardProps) {
  const [usingFreeze, setUsingFreeze] = useState(false);
  const [freezeSuccess, setFreezeSuccess] = useState(false);

  const stats = useMemo(
    () => calculateUserXP(currentUser.id, tasks, studyLogs, streaks, goals),
    [currentUser.id, tasks, studyLogs, streaks, goals]
  );

  const myStreak = streaks.find((s) => s.user_id === currentUser.id);
  const freezeTokens = myStreak?.freeze_tokens ?? 1;

  // Check if yesterday was missed and eligible for freeze
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }, []);

  const hasYesterdayActivity = useMemo(() => {
    const hadTask = tasks.some((t) => t.user_id === currentUser.id && t.task_date === yesterdayStr && t.is_done);
    const hadStudy = studyLogs.some((l) => l.user_id === currentUser.id && l.log_date === yesterdayStr);
    const isFrozen = (myStreak?.frozen_dates || []).includes(yesterdayStr);
    return hadTask || hadStudy || isFrozen;
  }, [tasks, studyLogs, currentUser.id, yesterdayStr, myStreak?.frozen_dates]);

  const handleUseFreeze = async () => {
    if (freezeTokens <= 0 || !myStreak) return;
    setUsingFreeze(true);
    try {
      const updatedDates = [...(myStreak.frozen_dates || []), yesterdayStr];
      const updatedTokens = Math.max(0, freezeTokens - 1);

      await supabase.from("streaks").update({
        freeze_tokens: updatedTokens,
        frozen_dates: updatedDates,
      }).eq("user_id", currentUser.id);

      await supabase.from("streak_freeze_logs").insert([{
        user_id: currentUser.id,
        frozen_date: yesterdayStr,
      }]);

      await supabase.from("activity_feed").insert([{
        user_id: currentUser.id,
        type: "streak_updated",
        content: `❄️ ${currentUser.username} activated a Streak Freeze to protect their streak!`,
      }]);

      setFreezeSuccess(true);
      setTimeout(() => setFreezeSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUsingFreeze(false);
    }
  };

  return (
    <div className="card p-4 space-y-3.5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #14121f, #161616)",
        border: "1px solid #7c5cfc25",
      }}>
      
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `${stats.tier.color}10`, filter: "blur(40px)" }} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
            style={{ background: `${stats.tier.color}20`, border: `1px solid ${stats.tier.color}40` }}>
            {stats.tier.icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black" style={{ color: "#f0f0f0" }}>
                Level {stats.level}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${stats.tier.color}20`, color: stats.tier.color }}>
                {stats.tier.title}
              </span>
            </div>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: "#777" }}>
              {stats.xp.toLocaleString()} Total XP earned
            </p>
          </div>
        </div>

        {/* Freeze Tokens Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background: "#0c1b29", border: "1px solid #38bdf830", color: "#38bdf8" }}>
          <Snowflake className="w-3.5 h-3.5" />
          <span>{freezeTokens} Freeze{freezeTokens !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span style={{ color: "#888" }}>Progress to Level {stats.level + 1}</span>
          <span className="font-bold tabular-nums" style={{ color: "#f0f0f0" }}>
            {stats.xp - stats.currentLevelMinXP} / {stats.nextLevelXP - stats.currentLevelMinXP} XP ({stats.progressPct}%)
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1c1c1c" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.progressPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, #7c5cfc, ${stats.tier.color})` }}
          />
        </div>
      </div>

      {/* Freeze warning & Action */}
      {!hasYesterdayActivity && freezeTokens > 0 && (
        <div className="p-3 rounded-xl flex items-center justify-between gap-2"
          style={{ background: "#0a1926", border: "1px solid #38bdf830" }}>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" style={{ color: "#38bdf8" }} />
            <div>
              <p className="text-xs font-bold" style={{ color: "#38bdf8" }}>Streak at risk!</p>
              <p className="text-[10px]" style={{ color: "#7ba7c7" }}>Missed yesterday? Use 1 freeze token.</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleUseFreeze}
            disabled={usingFreeze || freezeSuccess}
            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
            style={{ background: "#38bdf8", color: "#000" }}>
            {freezeSuccess ? <Check className="w-3.5 h-3.5" /> : <Snowflake className="w-3.5 h-3.5" />}
            {freezeSuccess ? "Protected!" : "Use Freeze"}
          </motion.button>
        </div>
      )}
    </div>
  );
}
