"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HourlyLog, HourlyActivityType, User, Task, StudyLog, RoutineLog, Routine } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import {
  Clock,
  Calendar,
  Zap,
  Skull,
  Code2,
  BookOpen,
  Dumbbell,
  Briefcase,
  Sparkles,
  Utensils,
  Moon,
  HelpCircle,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
  PieChart,
} from "lucide-react";

interface HourlyTrackerProps {
  logs: HourlyLog[];
  users: User[];
  currentUser: User;
  tasks?: Task[];
  studyLogs?: StudyLog[];
  routines?: Routine[];
  routineLogs?: RoutineLog[];
  onRefresh: () => void;
}

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  pruthvi: "#7c5cfc",
  kevin: "#f5c518",
};

const CREW = ["rushil", "pruthvi", "kevin"];

export const ACTIVITY_CONFIG: Record<
  HourlyActivityType,
  { label: string; emoji: string; color: string; isProductive: boolean; isWasted: boolean }
> = {
  coding:     { label: "Coding / DSA",      emoji: "💻", color: "#7c5cfc", isProductive: true,  isWasted: false },
  study:      { label: "Study / College",   emoji: "📚", color: "#38bdf8", isProductive: true,  isWasted: false },
  gym:        { label: "Gym & Fitness",     emoji: "🏋️", color: "#ec4899", isProductive: true,  isWasted: false },
  work:       { label: "Work & Projects",   emoji: "⚡", color: "#22c55e", isProductive: true,  isWasted: false },
  routine:    { label: "Habits & Routine",  emoji: "✨", color: "#a855f7", isProductive: true,  isWasted: false },
  meal_break: { label: "Meal & Break",      emoji: "🍽️", color: "#f59e0b", isProductive: false, isWasted: false },
  sleep:      { label: "Sleep & Rest",      emoji: "😴", color: "#64748b", isProductive: false, isWasted: false },
  wasted:     { label: "Wasted / Distracted", emoji: "💀", color: "#ef4444", isProductive: false, isWasted: true  },
  other:      { label: "Other Activity",    emoji: "🔘", color: "#71717a", isProductive: false, isWasted: false },
};

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

export function HourlyTracker({
  logs = [],
  users = [],
  currentUser,
  tasks = [],
  studyLogs = [],
  routines = [],
  routineLogs = [],
  onRefresh,
}: HourlyTrackerProps) {
  const isLeader = currentUser?.username?.toLowerCase() === "rushil" || currentUser?.role === "leader";

  const [selectedUserKey, setSelectedUserKey] = useState<string>(() => currentUser?.username?.toLowerCase() || "rushil");
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [editingHour, setEditingHour] = useState<number | null>(null);

  // Edit form states
  const [editCategory, setEditCategory] = useState<HourlyActivityType>("coding");
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const currentHour = useMemo(() => new Date().getHours(), []);

  const safeUsers = users || [];
  const safeLogs = logs || [];

  const selectedUser = safeUsers.find((u) => u && u.username && u.username.toLowerCase() === selectedUserKey) || currentUser;
  const userColor = USER_COLORS[selectedUserKey] || "#22c55e";

  // Filter logs for selected user & date
  const dayLogsMap = useMemo(() => {
    const map = new Map<number, HourlyLog>();
    safeLogs
      .filter((l) => l && l.user_id === selectedUser?.id && l.log_date === selectedDate)
      .forEach((l) => map.set(l.hour_block, l));
    return map;
  }, [safeLogs, selectedUser?.id, selectedDate]);

  // Daily statistics
  const stats = useMemo(() => {
    let productiveHours = 0;
    let wastedHours = 0;
    let sleepHours = 0;
    let breakHours = 0;
    let otherHours = 0;

    for (let h = 0; h < 24; h++) {
      const log = dayLogsMap.get(h);
      if (log) {
        const conf = ACTIVITY_CONFIG[log.activity_type] || ACTIVITY_CONFIG.other;
        if (conf.isProductive) productiveHours++;
        else if (conf.isWasted) wastedHours++;
        else if (log.activity_type === "sleep") sleepHours++;
        else if (log.activity_type === "meal_break") breakHours++;
        else otherHours++;
      }
    }

    const trackedHours = productiveHours + wastedHours + sleepHours + breakHours + otherHours;
    const focusDenom = productiveHours + wastedHours;
    const focusScore = focusDenom > 0 ? Math.round((productiveHours / focusDenom) * 100) : 0;

    return {
      productiveHours,
      wastedHours,
      sleepHours,
      breakHours,
      otherHours,
      trackedHours,
      focusScore,
    };
  }, [dayLogsMap]);

  // Quick suggestions from other features on this day
  const daySuggestions = useMemo(() => {
    const suggestions: string[] = [];
    (studyLogs || [])
      .filter((s) => s.user_id === selectedUser?.id && s.log_date === selectedDate)
      .forEach((s) => suggestions.push(`Study: ${s.subject} (${s.duration_minutes}m)`));

    (tasks || [])
      .filter((t) => t.user_id === selectedUser?.id && t.task_date === selectedDate && t.is_done)
      .forEach((t) => suggestions.push(`Task: ${t.title}`));

    (routineLogs || [])
      .filter((r) => r.user_id === selectedUser?.id && r.log_date === selectedDate)
      .forEach((r) => {
        const matched = (routines || []).find((rt) => rt.id === r.routine_id);
        if (matched) suggestions.push(`Habit: ${matched.emoji} ${matched.title}`);
      });

    return suggestions.slice(0, 4);
  }, [studyLogs, tasks, routineLogs, routines, selectedUser?.id, selectedDate]);

  const handleOpenHour = (hour: number) => {
    const existing = dayLogsMap.get(hour);
    if (existing) {
      setEditCategory(existing.activity_type);
      setEditTitle(existing.title || "");
      setEditNotes(existing.notes || "");
    } else {
      // Default guess based on time
      if (hour >= 0 && hour <= 6) setEditCategory("sleep");
      else if (hour === 13 || hour === 20) setEditCategory("meal_break");
      else setEditCategory("coding");
      setEditTitle("");
      setEditNotes("");
    }
    setEditingHour(hour);
  };

  const handleSaveHour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHour === null || !selectedUser) return;
    setSaving(true);

    try {
      const existing = dayLogsMap.get(editingHour);

      if (existing) {
        await supabase
          .from("hourly_logs")
          .update({
            activity_type: editCategory,
            title: editTitle.trim() || null,
            notes: editNotes.trim() || null,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("hourly_logs").insert([
          {
            user_id: selectedUser.id,
            log_date: selectedDate,
            hour_block: editingHour,
            activity_type: editCategory,
            title: editTitle.trim() || null,
            notes: editNotes.trim() || null,
          },
        ]);
      }

      setEditingHour(null);
      onRefresh();
    } catch (err) {
      console.error("Save hourly log error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHour = async () => {
    if (editingHour === null || !selectedUser) return;
    const existing = dayLogsMap.get(editingHour);
    if (existing) {
      setSaving(true);
      await supabase.from("hourly_logs").delete().eq("id", existing.id);
      setSaving(false);
      setEditingHour(null);
      onRefresh();
    } else {
      setEditingHour(null);
    }
  };

  const navigateDate = (offset: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">Hourly Time Audit</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
              <Clock className="w-3 h-3" /> 24-Hour Timeline
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Audit your day hour by hour. Track productive focus vs. wasted time.
          </p>
        </div>

        {/* Date Selector Pill */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => navigateDate(-1)}
            className="p-1 rounded-lg text-gray-400 hover:text-white"
            title="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            max={todayStr}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer px-1 text-center"
          />
          <button
            type="button"
            onClick={() => navigateDate(1)}
            disabled={selectedDate >= todayStr}
            className="p-1 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Member Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CREW.map((uname) => {
          const isSelected = selectedUserKey === uname;
          const uObj = safeUsers.find((u) => u && u.username && u.username.toLowerCase() === uname);
          const uColor = USER_COLORS[uname];

          return (
            <button
              key={uname}
              type="button"
              onClick={() => setSelectedUserKey(uname)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 capitalize"
              style={{
                background: isSelected ? `${uColor}18` : "#141416",
                border: `1px solid ${isSelected ? uColor : "#222"}`,
                color: isSelected ? "#ffffff" : "#777",
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: uColor }} />
              {uname}
            </button>
          );
        })}
      </div>

      {/* ── TIME AUDIT SCORECARD ── */}
      <div
        className="card p-4 space-y-3 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #13141c, #0d0e14)",
          border: "1px solid rgba(124, 92, 252, 0.2)",
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-purple-400" />
            Time Utilization & Efficiency Audit
          </p>
          <span className="text-[10px] text-gray-500 font-semibold">{stats.trackedHours}/24 Hours Logged</span>
        </div>

        {/* 3 Main KPIs */}
        <div className="grid grid-cols-3 gap-2">
          {/* Productive Hours */}
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-400 mb-0.5">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">Productive</span>
            </div>
            <p className="text-lg font-black text-white">{stats.productiveHours}h</p>
            <p className="text-[9px] text-emerald-300/70">Focused Time</p>
          </div>

          {/* Wasted Hours */}
          <div
            className="p-3 rounded-2xl border text-center"
            style={{
              background: stats.wastedHours > 0 ? "rgba(239, 68, 68, 0.12)" : "rgba(255, 255, 255, 0.03)",
              borderColor: stats.wastedHours > 0 ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.08)",
            }}
          >
            <div className="flex items-center justify-center gap-1 text-red-400 mb-0.5">
              <Skull className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">Wasted</span>
            </div>
            <p className="text-lg font-black text-red-400">{stats.wastedHours}h</p>
            <p className="text-[9px] text-red-300/70">{stats.wastedHours > 2 ? "High Alert!" : "Procrastination"}</p>
          </div>

          {/* Focus Score */}
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
            <div className="flex items-center justify-center gap-1 text-purple-400 mb-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">Focus Score</span>
            </div>
            <p className="text-lg font-black text-white">{stats.focusScore}%</p>
            <p className="text-[9px] text-purple-300/70">Efficiency</p>
          </div>
        </div>

        {/* Progress Bar of Day (Productive vs Wasted vs Neutral) */}
        <div className="space-y-1 pt-1">
          <div className="h-2.5 rounded-full overflow-hidden flex bg-white/[0.04] p-0.5 gap-0.5">
            {stats.productiveHours > 0 && (
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${(stats.productiveHours / 24) * 100}%` }}
                title={`Productive: ${stats.productiveHours}h`}
              />
            )}
            {stats.wastedHours > 0 && (
              <div
                className="h-full rounded-full bg-red-500"
                style={{ width: `${(stats.wastedHours / 24) * 100}%` }}
                title={`Wasted: ${stats.wastedHours}h`}
              />
            )}
            {stats.sleepHours > 0 && (
              <div
                className="h-full rounded-full bg-slate-500"
                style={{ width: `${(stats.sleepHours / 24) * 100}%` }}
                title={`Sleep: ${stats.sleepHours}h`}
              />
            )}
            {stats.breakHours > 0 && (
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${(stats.breakHours / 24) * 100}%` }}
                title={`Meals/Break: ${stats.breakHours}h`}
              />
            )}
          </div>
          <div className="flex justify-between text-[9px] text-gray-500 px-0.5">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Focus</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Wasted</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Sleep</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Breaks</span>
          </div>
        </div>
      </div>

      {/* ── 24-HOUR HOURLY TIMELINE ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Hourly Blocks (00:00 - 23:00)
          </p>
          <span className="text-[10px] text-purple-400 font-semibold">Tap hour to log activity</span>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {Array.from({ length: 24 }, (_, hour) => {
            const log = dayLogsMap.get(hour);
            const isNow = selectedDate === todayStr && currentHour === hour;
            const categoryConfig = log ? ACTIVITY_CONFIG[log.activity_type] || ACTIVITY_CONFIG.other : null;

            return (
              <motion.button
                key={hour}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOpenHour(hour)}
                className="w-full p-2.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all relative overflow-hidden"
                style={{
                  background: log
                    ? categoryConfig?.isWasted
                      ? "linear-gradient(90deg, #261010, #141113)"
                      : categoryConfig?.isProductive
                      ? "linear-gradient(90deg, #101c16, #121318)"
                      : "#141418"
                    : "#0e0f14",
                  border: isNow
                    ? `1.5px solid ${userColor}`
                    : log
                    ? `1px solid ${categoryConfig?.color}35`
                    : "1px solid rgba(255, 255, 255, 0.04)",
                  boxShadow: isNow ? `0 0 12px -3px ${userColor}40` : "none",
                }}
              >
                {/* Time & Indicator */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-18 shrink-0 flex flex-col">
                    <span
                      className="text-xs font-bold"
                      style={{ color: isNow ? userColor : "#ffffff" }}
                    >
                      {formatHour(hour)}
                    </span>
                    {isNow && (
                      <span className="text-[9px] font-black text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Current
                      </span>
                    )}
                  </div>

                  {/* Activity Badge & Details */}
                  {log && categoryConfig ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{categoryConfig.emoji}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase"
                            style={{
                              background: `${categoryConfig.color}25`,
                              color: categoryConfig.color,
                            }}
                          >
                            {categoryConfig.label}
                          </span>
                          {categoryConfig.isWasted && (
                            <span className="text-[9px] font-black text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded">
                              💀 WASTED
                            </span>
                          )}
                        </div>
                        {log.title && (
                          <p className="text-xs text-white font-medium truncate mt-0.5">
                            {log.title}
                          </p>
                        )}
                        {log.notes && (
                          <p className="text-[10px] text-gray-400 truncate">
                            {log.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-600 text-xs italic">
                      <span>— Tap to log activity</span>
                    </div>
                  )}
                </div>

                {/* Edit Icon / Status indicator */}
                <div className="shrink-0 flex items-center gap-1">
                  {log ? (
                    <span className="text-[10px] font-semibold text-gray-500 hover:text-white px-2 py-1 rounded-lg bg-white/5">
                      Edit
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/[0.03] text-gray-600 hover:text-white">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── HOUR LOGGER MODAL / BOTTOM SHEET ── */}
      <AnimatePresence>
        {editingHour !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingHour(null)}
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
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      Log {formatHour(editingHour)} - {formatHour((editingHour + 1) % 24)}
                    </h3>
                    <p className="text-[10px] text-gray-400">{selectedDate}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingHour(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveHour} className="space-y-3.5">
                {/* Category Grid */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Select Activity Category
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(Object.keys(ACTIVITY_CONFIG) as HourlyActivityType[]).map((catKey) => {
                      const conf = ACTIVITY_CONFIG[catKey];
                      const isSelected = editCategory === catKey;
                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => setEditCategory(catKey)}
                          className="p-2 rounded-xl flex flex-col items-center justify-center text-center transition-all"
                          style={{
                            background: isSelected ? `${conf.color}25` : "rgba(255, 255, 255, 0.03)",
                            border: `1.5px solid ${isSelected ? conf.color : "rgba(255, 255, 255, 0.06)"}`,
                            color: isSelected ? "#ffffff" : "#888899",
                          }}
                        >
                          <span className="text-base">{conf.emoji}</span>
                          <span className="text-[10px] font-bold mt-0.5 leading-tight truncate w-full">
                            {conf.label.split(" ")[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Suggestions chip row if available */}
                {daySuggestions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 font-semibold">Suggested from today:</span>
                    <div className="flex flex-wrap gap-1">
                      {daySuggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditTitle(sug)}
                          className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[9px] text-gray-300 truncate max-w-full text-left"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    What did you do? (Title)
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder={
                      editCategory === "wasted"
                        ? "e.g. Scrolled reels / YouTube binge..."
                        : editCategory === "coding"
                        ? "e.g. Solved 2 Graph problems on LeetCode..."
                        : "e.g. Core workout / Chapter 4 study..."
                    }
                    className="input-field"
                  />
                </div>

                {/* Optional Notes Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Notes / Reflection (Optional)
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. Lost focus around 3:30 PM..."
                    className="input-field py-2 text-xs"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  {dayLogsMap.has(editingHour) && (
                    <button
                      type="button"
                      onClick={handleDeleteHour}
                      disabled={saving}
                      className="px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Clear this hour"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Hour Log"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
