"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Task, StudyLog, Goal, Streak, User } from "@/lib/types";
import { Trophy } from "lucide-react";

interface BadgeData {
  currentStreak: number;
  longestStreak: number;
  totalDSAProblems: number;
  studyStreak: number;
  tasksEverDone: number;
  hasPerfectDay: boolean;
  goalsAchieved: number;
  studySessionsTotal: number;
}

interface Badge {
  id:    string;
  emoji: string;
  title: string;
  desc:  string;
  check: (d: BadgeData) => boolean;
  tier:  "bronze" | "silver" | "gold" | "platinum";
}

const BADGES: Badge[] = [
  { id: "first_task",    emoji: "✅", title: "First Step",       desc: "Complete your first task",          tier: "bronze",   check: (d) => d.tasksEverDone >= 1 },
  { id: "streak_3",      emoji: "🔥", title: "On a Roll",         desc: "Reach a 3-day task streak",         tier: "bronze",   check: (d) => d.longestStreak >= 3 },
  { id: "streak_7",      emoji: "🔥", title: "Week Warrior",      desc: "Reach a 7-day task streak",         tier: "silver",   check: (d) => d.longestStreak >= 7 },
  { id: "streak_30",     emoji: "👑", title: "Month Master",      desc: "Reach a 30-day task streak",        tier: "gold",     check: (d) => d.longestStreak >= 30 },
  { id: "perfect_day",   emoji: "💯", title: "Perfect Day",       desc: "Complete all tasks on a single day",tier: "silver",   check: (d) => d.hasPerfectDay },
  { id: "dsa_10",        emoji: "💻", title: "Problem Solver",    desc: "Solve 10 DSA problems",             tier: "bronze",   check: (d) => d.totalDSAProblems >= 10 },
  { id: "dsa_50",        emoji: "💻", title: "Code Grinder",      desc: "Solve 50 DSA problems",             tier: "silver",   check: (d) => d.totalDSAProblems >= 50 },
  { id: "dsa_100",       emoji: "💻", title: "Code Beast",        desc: "Solve 100 DSA problems",            tier: "gold",     check: (d) => d.totalDSAProblems >= 100 },
  { id: "dsa_500",       emoji: "🦾", title: "LeetCode Legend",   desc: "Solve 500 DSA problems",            tier: "platinum", check: (d) => d.totalDSAProblems >= 500 },
  { id: "study_start",   emoji: "📚", title: "Scholar",           desc: "Log your first study session",      tier: "bronze",   check: (d) => d.studySessionsTotal >= 1 },
  { id: "study_streak7", emoji: "📖", title: "Study Streak",      desc: "Study 7 days in a row",             tier: "silver",   check: (d) => d.studyStreak >= 7 },
  { id: "study_streak30",emoji: "🧠", title: "Learning Machine",  desc: "Study 30 days in a row",            tier: "gold",     check: (d) => d.studyStreak >= 30 },
  { id: "goal_win",      emoji: "🏆", title: "Champion",          desc: "Achieve your first group goal",     tier: "gold",     check: (d) => d.goalsAchieved >= 1 },
  { id: "goal_3",        emoji: "🏆", title: "Serial Winner",     desc: "Achieve 3 group goals",             tier: "platinum", check: (d) => d.goalsAchieved >= 3 },
];

const TIER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  bronze:   { bg: "#1a1208", border: "#cd7f3230", text: "#cd7f32" },
  silver:   { bg: "#111318", border: "#a8b0be30", text: "#a8b0be" },
  gold:     { bg: "#1a1500", border: "#f5c51830", text: "#f5c518" },
  platinum: { bg: "#0f101a", border: "#7c5cfc30", text: "#7c5cfc" },
};

interface AchievementsPanelProps {
  tasks:      Task[];
  studyLogs:  StudyLog[];
  goals:      Goal[];
  streaks:    Streak[];
  currentUser:User;
}

export function AchievementsPanel({ tasks = [], studyLogs = [], goals = [], streaks = [], currentUser }: AchievementsPanelProps) {
  const [showAll, setShowAll] = React.useState(false);

  const safeTasks = tasks || [];
  const safeStudy = studyLogs || [];
  const safeGoals = goals || [];
  const safeStreaks = streaks || [];

  const myStreak = safeStreaks.find((s) => s && s.user_id === currentUser?.id);

  const badgeData = useMemo<BadgeData>(() => {
    if (!currentUser) {
      return {
        tasksEverDone: 0,
        longestStreak: 0,
        currentStreak: 0,
        totalDSAProblems: 0,
        studySessionsTotal: 0,
        studyStreak: 0,
        goalsAchieved: 0,
        hasPerfectDay: false,
      };
    }
    const myTasks     = safeTasks.filter((t) => t && t.user_id === currentUser.id);
    const myStudyLogs = safeStudy.filter((l) => l && l.user_id === currentUser.id);

    // Study streak
    const dates = [...new Set(myStudyLogs.map((l) => l.log_date))].sort().reverse();
    let studyStreak = 0;
    const exp = new Date(); exp.setHours(0, 0, 0, 0);
    for (const d of dates) {
      const expStr = exp.toISOString().split("T")[0];
      if (d === expStr) { studyStreak++; exp.setDate(exp.getDate() - 1); }
      else if (d < expStr) break;
    }

    // Perfect day — any date where all tasks were done
    const tasksByDate = myTasks.reduce<Record<string, { total: number; done: number }>>(
      (acc, t) => {
        if (!acc[t.task_date]) acc[t.task_date] = { total: 0, done: 0 };
        acc[t.task_date].total++;
        if (t.is_done) acc[t.task_date].done++;
        return acc;
      }, {}
    );
    const hasPerfectDay = Object.values(tasksByDate).some(
      ({ total, done }) => total > 0 && total === done
    );

    return {
      currentStreak:     myStreak?.current_streak  || 0,
      longestStreak:     myStreak?.longest_streak  || 0,
      totalDSAProblems:  myStudyLogs.filter((l) => l.category === "dsa").reduce((s, l) => s + l.problems_solved, 0),
      studyStreak,
      tasksEverDone:     myTasks.filter((t) => t.is_done).length,
      hasPerfectDay,
      goalsAchieved:     safeGoals.filter((g) => g && g.status === "achieved").length,
      studySessionsTotal:myStudyLogs.length,
    };
  }, [safeTasks, safeStudy, safeGoals, safeStreaks, currentUser?.id, myStreak]);

  const { earned, locked } = useMemo(() => {
    const earned = BADGES.filter((b) => b.check(badgeData));
    const locked  = BADGES.filter((b) => !b.check(badgeData));
    return { earned, locked };
  }, [badgeData]);

  const visible = showAll ? locked : locked.slice(0, 3);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" style={{ color: "#f5c518" }} />
          <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>Achievements</h2>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: "#1a1500", color: "#f5c518", border: "1px solid #f5c51820" }}>
          {earned.length}/{BADGES.length} earned
        </span>
      </div>

      {/* Earned badges */}
      {earned.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {earned.map((badge) => {
            const colors = TIER_COLORS[badge.tier];
            return (
              <motion.div
                key={badge.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="card p-3 flex items-center gap-2.5"
                style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
              >
                <span style={{ fontSize: 22 }}>{badge.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-black truncate" style={{ color: colors.text }}>{badge.title}</p>
                  <p className="text-[9px] leading-tight mt-0.5" style={{ color: "#444" }}>{badge.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {earned.length === 0 && (
        <div className="card p-6 text-center space-y-2">
          <span style={{ fontSize: 32 }}>🎯</span>
          <p className="text-sm font-bold" style={{ color: "#444" }}>No badges yet</p>
          <p className="text-xs" style={{ color: "#333" }}>Complete tasks, study, and achieve goals to earn badges</p>
        </div>
      )}

      {/* Locked badges */}
      {locked.length > 0 && (
        <>
          <p className="text-[10px] font-bold tracking-widest" style={{ color: "#333" }}>LOCKED</p>
          <div className="grid grid-cols-2 gap-2">
            {visible.map((badge) => (
              <div key={badge.id} className="card p-3 flex items-center gap-2.5"
                style={{ opacity: 0.4 }}>
                <span style={{ fontSize: 22, filter: "grayscale(1)" }}>{badge.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-black truncate" style={{ color: "#666" }}>{badge.title}</p>
                  <p className="text-[9px] leading-tight mt-0.5" style={{ color: "#333" }}>{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {locked.length > 3 && (
            <button onClick={() => setShowAll((v) => !v)}
              className="w-full text-xs font-bold py-2" style={{ color: "#444" }}>
              {showAll ? "Show less ↑" : `+${locked.length - 3} more locked`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
