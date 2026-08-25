"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, RoutineLog, DailyCheckin, Streak, User, StudyLog, BodyWeightLog } from "@/lib/types";
import { Flame, Snowflake, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trophy, Dumbbell, BookOpen, CheckSquare, Sparkles } from "lucide-react";

interface StreakCalendarProps {
  users: User[];
  tasks: Task[];
  routineLogs: RoutineLog[];
  checkins: DailyCheckin[];
  studyLogs?: StudyLog[];
  weightLogs?: BodyWeightLog[];
  streaks: Streak[];
  currentUser: User;
}

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  alan: "#7c5cfc",
  kevin: "#f5c518",
};

const CREW = ["rushil", "alan", "kevin"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface DayDetail {
  tasksCount: number;
  studyMinutes: number;
  gymCount: number;
  routineCount: number;
  checkinCount: number;
  isFrozen: boolean;
  isActive: boolean;
}

export function StreakCalendar({
  users = [],
  tasks = [],
  routineLogs = [],
  checkins = [],
  studyLogs = [],
  weightLogs = [],
  streaks = [],
  currentUser,
}: StreakCalendarProps) {
  const [selectedUserKey, setSelectedUserKey] = useState(currentUser.username.toLowerCase());
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayDetail, setSelectedDayDetail] = useState<{ dateStr: string; detail: DayDetail } | null>(null);

  const safeUsers = users || [];
  const safeTasks = tasks || [];
  const safeRoutines = routineLogs || [];
  const safeCheckins = checkins || [];
  const safeStudy = studyLogs || [];
  const safeWeight = weightLogs || [];
  const safeStreaks = streaks || [];

  const selectedUser = safeUsers.find((u) => u && u.username && u.username.toLowerCase() === selectedUserKey) || currentUser;
  const userColor = USER_COLORS[selectedUserKey] || "#22c55e";
  const userStreak = safeStreaks.find((s) => s && s.user_id === selectedUser?.id);

  // Month navigation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthName = currentDate.toLocaleString("en-US", { month: "long" });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayDetail(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayDetail(null);
  };

  const jumpToCurrentMonth = () => {
    setCurrentDate(new Date());
    setSelectedDayDetail(null);
  };

  // Build a detailed map for the selected user: dateStr => DayDetail
  const activityMap = useMemo(() => {
    const map = new Map<string, DayDetail>();
    if (!selectedUser) return map;
    const uid = selectedUser.id;

    const getOrInit = (date: string): DayDetail => {
      let existing = map.get(date);
      if (!existing) {
        existing = {
          tasksCount: 0,
          studyMinutes: 0,
          gymCount: 0,
          routineCount: 0,
          checkinCount: 0,
          isFrozen: false,
          isActive: false,
        };
        map.set(date, existing);
      }
      return existing;
    };

    safeTasks.filter((t) => t && t.user_id === uid && t.is_done && t.task_date).forEach((t) => {
      const d = getOrInit(t.task_date!);
      d.tasksCount++;
      d.isActive = true;
    });

    safeRoutines.filter((l) => l && l.user_id === uid && l.log_date).forEach((l) => {
      const d = getOrInit(l.log_date);
      d.routineCount++;
      d.isActive = true;
    });

    safeCheckins.filter((c) => c && c.user_id === uid && c.checkin_date).forEach((c) => {
      const d = getOrInit(c.checkin_date);
      d.checkinCount++;
      d.isActive = true;
    });

    safeStudy.filter((s) => s && s.user_id === uid && s.log_date).forEach((s) => {
      const d = getOrInit(s.log_date);
      d.studyMinutes += (s.duration_minutes || 0);
      d.isActive = true;
    });

    safeWeight.filter((w) => w && w.user_id === uid && w.log_date).forEach((w) => {
      const d = getOrInit(w.log_date);
      d.gymCount++;
      d.isActive = true;
    });

    (userStreak?.frozen_dates || []).forEach((fDate) => {
      const d = getOrInit(fDate);
      d.isFrozen = true;
      d.isActive = true;
    });

    return map;
  }, [selectedUser, safeTasks, safeRoutines, safeCheckins, safeStudy, safeWeight, userStreak]);

  // Calendar Grid generation for current month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Monday as first day of week: 0=Mon, 6=Sun
    const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const days: ({ dayNum: number; dateStr: string; isCurrentMonth: boolean } | null)[] = [];

    // Empty cells before start of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Actual days of the month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const monthPadded = String(month + 1).padStart(2, "0");
      const dayPadded = String(day).padStart(2, "0");
      const dateStr = `${year}-${monthPadded}-${dayPadded}`;
      days.push({
        dayNum: day,
        dateStr,
        isCurrentMonth: true,
      });
    }

    return days;
  }, [year, month]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Stats for the currently viewed month
  const monthStats = useMemo(() => {
    let activeDaysCount = 0;
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const monthPadded = String(month + 1).padStart(2, "0");
      const dayPadded = String(day).padStart(2, "0");
      const dateStr = `${year}-${monthPadded}-${dayPadded}`;
      const detail = activityMap.get(dateStr);
      if (detail && detail.isActive) {
        activeDaysCount++;
      }
    }

    const pct = Math.round((activeDaysCount / totalDaysInMonth) * 100);
    return { activeDaysCount, totalDaysInMonth, pct };
  }, [year, month, activityMap]);

  return (
    <div
      className="card p-4 space-y-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #13141c, #0b0c10)",
        border: "1px solid rgba(245, 197, 24, 0.25)",
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.8)",
      }}
    >
      {/* Background glow */}
      <div
        className="absolute top-0 right-0 w-44 h-44 rounded-full pointer-events-none"
        style={{ background: `${userColor}10`, filter: "blur(50px)" }}
      />

      {/* Header with Title & Member Selector */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-400"
            style={{ background: "rgba(245, 197, 24, 0.15)", border: "1px solid rgba(245, 197, 24, 0.3)" }}
          >
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Monthly Streaks Calendar</h3>
            <p className="text-[10px] text-gray-400">Track daily consistency with fire icons</p>
          </div>
        </div>

        {/* Member Selector Chips */}
        <div className="flex gap-1">
          {CREW.map((uname) => {
            const active = selectedUserKey === uname;
            const uColor = USER_COLORS[uname];
            return (
              <button
                key={uname}
                type="button"
                onClick={() => {
                  setSelectedUserKey(uname);
                  setSelectedDayDetail(null);
                }}
                className="px-2.5 py-1 rounded-xl text-xs font-bold capitalize transition-all"
                style={{
                  background: active ? `${uColor}25` : "rgba(255,255,255,0.04)",
                  color: active ? "#ffffff" : "#777",
                  border: `1px solid ${active ? uColor : "rgba(255,255,255,0.06)"}`,
                }}
              >
                {uname}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Scoreboard Bar */}
      <div className="grid grid-cols-4 gap-2 p-2.5 rounded-2xl bg-black/40 border border-white/5 text-center">
        <div>
          <p className="text-[9px] font-bold text-gray-400 uppercase">Streak</p>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-black text-white">{userStreak?.current_streak || 0}d</span>
          </div>
        </div>
        <div>
          <p className="text-[9px] font-bold text-gray-400 uppercase">Best</p>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <Trophy className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-black text-white">{userStreak?.longest_streak || 0}d</span>
          </div>
        </div>
        <div>
          <p className="text-[9px] font-bold text-gray-400 uppercase">Active Days</p>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <CalendarIcon className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-black text-white">{monthStats.activeDaysCount}/{monthStats.totalDaysInMonth}</span>
          </div>
        </div>
        <div>
          <p className="text-[9px] font-bold text-gray-400 uppercase">Consistency</p>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-black text-emerald-400">{monthStats.pct}%</span>
          </div>
        </div>
      </div>

      {/* Month Navigator Controls */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          title="Previous Month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white tracking-wide">
            {monthName} {year}
          </span>
          <button
            type="button"
            onClick={jumpToCurrentMonth}
            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-gray-300 hover:bg-white/20"
          >
            Today
          </button>
        </div>

        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          title="Next Month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {/* Day Name Headers */}
        <div className="grid grid-cols-7 gap-1 text-center pb-1">
          {DAY_NAMES.map((name) => (
            <span key={name} className="text-[10px] font-bold text-gray-500">
              {name}
            </span>
          ))}
        </div>

        {/* Day Cells (7-column grid) */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="h-12 rounded-xl bg-white/[0.01]" />;
            }

            const isToday = cell.dateStr === todayStr;
            const detail = activityMap.get(cell.dateStr);
            const isActive = Boolean(detail?.isActive);
            const isFrozen = Boolean(detail?.isFrozen);
            const isSelected = selectedDayDetail?.dateStr === cell.dateStr;

            return (
              <motion.button
                key={cell.dateStr}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => detail && setSelectedDayDetail({ dateStr: cell.dateStr, detail })}
                className="h-12 rounded-xl flex flex-col items-center justify-between p-1 transition-all relative overflow-hidden"
                style={{
                  background: isSelected
                    ? "rgba(245, 197, 24, 0.25)"
                    : isActive
                    ? "linear-gradient(180deg, #1f1710, #161219)"
                    : "rgba(255, 255, 255, 0.03)",
                  border: `1.5px solid ${
                    isSelected
                      ? "#f5c518"
                      : isToday
                      ? userColor
                      : isActive
                      ? "rgba(245, 197, 24, 0.35)"
                      : "rgba(255, 255, 255, 0.05)"
                  }`,
                  boxShadow: isActive ? "0 0 10px -3px rgba(245, 197, 24, 0.2)" : "none",
                }}
              >
                {/* Day number */}
                <span
                  className="text-[10px] font-bold leading-none"
                  style={{
                    color: isToday ? userColor : isActive ? "#ffffff" : "#666670",
                  }}
                >
                  {cell.dayNum}
                </span>

                {/* Fire or Snowflake Symbol */}
                {isFrozen ? (
                  <Snowflake className="w-4 h-4 text-cyan-400 shrink-0 mb-0.5" />
                ) : isActive ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="shrink-0"
                  >
                    <Flame className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(245,197,24,0.6)]" />
                  </motion.div>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-white/5 mb-1" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Activity Details Sheet */}
      <AnimatePresence>
        {selectedDayDetail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 rounded-2xl bg-black/60 border border-amber-500/30 space-y-2 text-xs overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> {selectedDayDetail.dateStr} Activity
              </span>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="text-[10px] text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
              {selectedDayDetail.detail.tasksCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="w-3 h-3 text-emerald-400" />
                  <span>{selectedDayDetail.detail.tasksCount} Tasks Done</span>
                </div>
              )}
              {selectedDayDetail.detail.studyMinutes > 0 && (
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-indigo-400" />
                  <span>{selectedDayDetail.detail.studyMinutes}m Study Time</span>
                </div>
              )}
              {selectedDayDetail.detail.gymCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Dumbbell className="w-3 h-3 text-pink-400" />
                  <span>Gym Workout Logged</span>
                </div>
              )}
              {selectedDayDetail.detail.routineCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>{selectedDayDetail.detail.routineCount} Habits Completed</span>
                </div>
              )}
              {selectedDayDetail.detail.isFrozen && (
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <Snowflake className="w-3 h-3" />
                  <span>Streak Protected by Freeze</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
