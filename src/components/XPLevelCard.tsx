"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Task, StudyLog, Streak, Goal, BodyWeightLog } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Zap, ShieldAlert, Snowflake, Trophy, Sparkles, Check, Info, X, Calculator, HelpCircle, Dumbbell } from "lucide-react";

interface XPLevelCardProps {
  currentUser: User;
  tasks: Task[];
  studyLogs: StudyLog[];
  streaks: Streak[];
  goals: Goal[];
  weightLogs?: BodyWeightLog[];
  onRefresh: () => void;
}

const LEVEL_TIERS = [
  { minLevel: 1,  title: "Novice",            color: "#94a3b8", icon: "🌱" },
  { minLevel: 5,  title: "Apprentice",        color: "#22c55e", icon: "⚡" },
  { minLevel: 10, title: "Code Grinder",      color: "#38bdf8", icon: "💻" },
  { minLevel: 20, title: "Study Machine",     color: "#a78bfa", icon: "🧠" },
  { minLevel: 35, title: "Elite Doomsdayer",  color: "#f59e0b", icon: "🔥" },
  { minLevel: 50, title: "Legendary Survivor",color: "#ef4444", icon: "👑" },
];

export function calculateUserXP(
  userId: string,
  tasks: Task[] = [],
  studyLogs: StudyLog[] = [],
  streaks: Streak[] = [],
  goals: Goal[] = [],
  weightLogs: BodyWeightLog[] = []
): {
  xp: number;
  level: number;
  currentLevelMinXP: number;
  nextLevelXP: number;
  progressPct: number;
  tier: typeof LEVEL_TIERS[0];
  breakdown: {
    tasksCount: number;
    taskXP: number;
    dsaCount: number;
    dsaXP: number;
    studyMins: number;
    studyXP: number;
    gymCount: number;
    gymXP: number;
    streakDays: number;
    streakXP: number;
    goalsCount: number;
    goalXP: number;
  };
} {
  const safeTasks = tasks || [];
  const safeStudy = studyLogs || [];
  const safeStreaks = streaks || [];
  const safeGoals = goals || [];
  const safeGym = weightLogs || [];

  const userTasks = safeTasks.filter((t) => t && t.user_id === userId && t.is_done);
  const userStudy = safeStudy.filter((l) => l && l.user_id === userId);
  const userStreak = safeStreaks.find((s) => s && s.user_id === userId);
  const userGoals = safeGoals.filter((g) => g && g.winner_id === userId && g.status === "achieved");
  const userGym = safeGym.filter((g) => g && g.user_id === userId);

  const tasksCount = userTasks.length;
  const taskXP = tasksCount * 10;

  const dsaCount = userStudy.filter((l) => l.category === "dsa").reduce((acc, l) => acc + (l.problems_solved || 0), 0);
  const dsaXP = dsaCount * 15;

  const studyMins = userStudy.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);
  const studyXP = studyMins * 1;

  const gymCount = userGym.length;
  const gymXP = gymCount * 20; // 20 XP per gym check-in / weight log

  const streakDays = userStreak?.longest_streak || 0;
  const streakXP = streakDays * 50;

  const goalsCount = userGoals.length;
  const goalXP = goalsCount * 250;

  const totalXP = taskXP + dsaXP + studyXP + gymXP + goalXP + streakXP;

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
    breakdown: {
      tasksCount,
      taskXP,
      dsaCount,
      dsaXP,
      studyMins,
      studyXP,
      gymCount,
      gymXP,
      streakDays,
      streakXP,
      goalsCount,
      goalXP,
    },
  };
}

export function XPLevelCard({ currentUser, tasks, studyLogs, streaks, goals, weightLogs = [], onRefresh }: XPLevelCardProps) {
  const [usingFreeze, setUsingFreeze] = useState(false);
  const [freezeSuccess, setFreezeSuccess] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  const stats = useMemo(
    () => calculateUserXP(currentUser?.id || "", tasks, studyLogs, streaks, goals, weightLogs),
    [currentUser?.id, tasks, studyLogs, streaks, goals, weightLogs]
  );

  const myStreak = (streaks || []).find((s) => s && s.user_id === currentUser?.id);
  const freezeTokens = myStreak?.freeze_tokens ?? 1;

  // Check if yesterday was missed and eligible for freeze
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }, []);

  const hasYesterdayActivity = useMemo(() => {
    if (!currentUser) return true;
    const hadTask = (tasks || []).some((t) => t && t.user_id === currentUser.id && t.task_date === yesterdayStr && t.is_done);
    const hadStudy = (studyLogs || []).some((l) => l && l.user_id === currentUser.id && l.log_date === yesterdayStr);
    const hadGym = (weightLogs || []).some((g) => g && g.user_id === currentUser.id && g.log_date === yesterdayStr);
    const isFrozen = (myStreak?.frozen_dates || []).includes(yesterdayStr);
    return hadTask || hadStudy || hadGym || isFrozen;
  }, [tasks, studyLogs, weightLogs, currentUser, yesterdayStr, myStreak?.frozen_dates]);

  const handleUseFreeze = async () => {
    if (freezeTokens <= 0 || !myStreak || !currentUser) return;
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
    <>
      <div
        className="card p-4 space-y-3.5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #13141c, #0d0e12)",
          border: "1px solid rgba(124, 92, 252, 0.2)",
          boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.7)",
        }}
      >
        {/* Background glow */}
        <div
          className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: `${stats.tier.color}15`, filter: "blur(45px)" }}
        />

        {/* Header: Level Badge, Title, XP, and Formula Info Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: `1px solid ${stats.tier.color}40`,
                boxShadow: `0 0 15px -3px ${stats.tier.color}30`,
              }}
            >
              {stats.tier.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white tracking-wide">
                  Level {stats.level}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${stats.tier.color}25`, color: stats.tier.color }}
                >
                  {stats.tier.title}
                </span>
              </div>
              {/* Pure White Text for XP */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs font-bold text-white tracking-wide">
                  {stats.xp.toLocaleString()} XP
                </p>
                <button
                  type="button"
                  onClick={() => setShowFormulaModal(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-white transition-colors"
                  title="How XP is calculated"
                >
                  <HelpCircle className="w-3 h-3 text-purple-400" />
                  <span className="underline decoration-dotted">Breakdown</span>
                </button>
              </div>
            </div>
          </div>

          {/* Freeze Tokens Pill */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
            style={{ background: "#0c1b29", border: "1px solid #38bdf840", color: "#38bdf8" }}
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>{freezeTokens} Freeze{freezeTokens !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-300 font-medium">Progress to Level {stats.level + 1}</span>
            <span className="font-bold tabular-nums text-white">
              {(stats.xp - stats.currentLevelMinXP).toLocaleString()} / {(stats.nextLevelXP - stats.currentLevelMinXP).toLocaleString()} XP ({stats.progressPct}%)
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1c1d24" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.progressPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, #7c5cfc, ${stats.tier.color})` }}
            />
          </div>
        </div>

        {/* Freeze Warning & Action */}
        {!hasYesterdayActivity && freezeTokens > 0 && (
          <div
            className="p-3 rounded-xl flex items-center justify-between gap-2"
            style={{ background: "#0a1926", border: "1px solid #38bdf835" }}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-cyan-400" />
              <div>
                <p className="text-xs font-bold text-cyan-300">Streak at risk!</p>
                <p className="text-[10px] text-cyan-200/70">Missed yesterday? Use 1 freeze token.</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleUseFreeze}
              disabled={usingFreeze || freezeSuccess}
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all"
              style={{ background: "#38bdf8", color: "#000" }}
            >
              {freezeSuccess ? <Check className="w-3.5 h-3.5" /> : <Snowflake className="w-3.5 h-3.5" />}
              {freezeSuccess ? "Protected!" : "Use Freeze"}
            </motion.button>
          </div>
        )}
      </div>

      {/* "How XP is Calculated" Interactive Modal */}
      <AnimatePresence>
        {showFormulaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFormulaModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm rounded-3xl p-5 space-y-4 z-10"
              style={{
                background: "rgba(18, 19, 26, 0.98)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9)",
              }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">How XP is Calculated</h3>
                    <p className="text-[10px] text-gray-400">Doomsday Progression System</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFormulaModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Formula List */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-gray-300">✅ Daily Task Done</span>
                  <span className="font-bold text-emerald-400">+10 XP</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-gray-300">💻 DSA Problem Solved</span>
                  <span className="font-bold text-sky-400">+15 XP</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-gray-300">🧠 Study Time Logged</span>
                  <span className="font-bold text-indigo-400">+1 XP / min</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-gray-300">🏋️ Gym / Weight Check-in</span>
                  <span className="font-bold text-pink-400">+20 XP</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-gray-300">🔥 Longest Task Streak</span>
                  <span className="font-bold text-amber-400">+50 XP / day</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-gray-300">🏆 Challenge Goal Won</span>
                  <span className="font-bold text-purple-400">+250 XP</span>
                </div>
              </div>

              {/* Current Breakdown for user */}
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Live Breakdown</p>
                <div className="space-y-1 text-[11px] text-gray-300">
                  <div className="flex justify-between">
                    <span>{stats.breakdown.tasksCount} Tasks completed:</span>
                    <span className="font-semibold text-white">+{stats.breakdown.taskXP} XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{stats.breakdown.dsaCount} DSA problems:</span>
                    <span className="font-semibold text-white">+{stats.breakdown.dsaXP} XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{stats.breakdown.studyMins}m Study logged:</span>
                    <span className="font-semibold text-white">+{stats.breakdown.studyXP} XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{stats.breakdown.gymCount} Gym check-ins:</span>
                    <span className="font-semibold text-white">+{stats.breakdown.gymXP} XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{stats.breakdown.streakDays}d Best streak:</span>
                    <span className="font-semibold text-white">+{stats.breakdown.streakXP} XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{stats.breakdown.goalsCount} Goals won:</span>
                    <span className="font-semibold text-white">+{stats.breakdown.goalXP} XP</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-white/10 font-bold text-white">
                    <span>Total XP:</span>
                    <span className="text-emerald-400">{stats.xp.toLocaleString()} XP</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 text-center leading-relaxed">
                💡 Completed something by mistake? Delete or uncheck the task and its XP is automatically deducted immediately.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
