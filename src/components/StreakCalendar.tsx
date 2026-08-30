"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, Routine, RoutineLog, DailyCheckin, Streak, User, StudyLog, BodyWeightLog, ImportantEvent } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Flame, Snowflake, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trophy, Dumbbell, BookOpen, CheckSquare, Sparkles, GraduationCap, Plus, Trash2, X, Clock, AlertTriangle, Check, Repeat2 } from "lucide-react";

interface StreakCalendarProps {
  users: User[];
  tasks: Task[];
  routines?: Routine[];
  routineLogs: RoutineLog[];
  checkins: DailyCheckin[];
  studyLogs?: StudyLog[];
  weightLogs?: BodyWeightLog[];
  streaks: Streak[];
  events?: ImportantEvent[];
  currentUser: User;
  onRefreshEvents?: () => void;
}

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  pruthvi: "#7c5cfc",
  kevin: "#f5c518",
};

const CREW = ["rushil", "pruthvi", "kevin"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EVENT_CATEGORIES = [
  { id: "exam",      label: "Exam",       emoji: "🎓", color: "#f59e0b" },
  { id: "contest",   label: "Contest",    emoji: "💻", color: "#38bdf8" },
  { id: "project",   label: "Project",    emoji: "📝", color: "#a78bfa" },
  { id: "deadline",  label: "Deadline",   emoji: "⚠️", color: "#ef4444" },
  { id: "milestone", label: "Milestone",  emoji: "🎯", color: "#22c55e" },
] as const;

interface DayDetail {
  tasksCount: number;
  studyMinutes: number;
  gymCount: number;
  routineCount: number;
  checkinCount: number;
  isFrozen: boolean;
  isActive: boolean;
  dayEvents: ImportantEvent[];
  dayTasks: Task[];
  dayRoutines: { routine: Routine; log: RoutineLog }[];
}

export function StreakCalendar({
  users = [],
  tasks = [],
  routines = [],
  routineLogs = [],
  checkins = [],
  studyLogs = [],
  weightLogs = [],
  streaks = [],
  events = [],
  currentUser,
  onRefreshEvents,
}: StreakCalendarProps) {
  const [selectedUserKey, setSelectedUserKey] = useState(currentUser.username.toLowerCase());
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayDetail, setSelectedDayDetail] = useState<{ dateStr: string; detail: DayDetail } | null>(null);

  // Add event modal
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [eventCategory, setEventCategory] = useState<ImportantEvent["category"]>("exam");
  const [eventDesc, setEventDesc] = useState("");
  const [eventLoading, setEventLoading] = useState(false);

  const safeUsers = users || [];
  const safeTasks = tasks || [];
  const safeRoutines = routines || [];
  const safeRoutineLogs = routineLogs || [];
  const safeCheckins = checkins || [];
  const safeStudy = studyLogs || [];
  const safeWeight = weightLogs || [];
  const safeStreaks = streaks || [];
  const safeEvents = events || [];

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

  // Build a detailed map for selected user: dateStr => DayDetail
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
          dayEvents: [],
          dayTasks: [],
          dayRoutines: [],
        };
        map.set(date, existing);
      }
      return existing;
    };

    safeTasks.filter((t) => t && t.user_id === uid && t.task_date).forEach((t) => {
      const d = getOrInit(t.task_date!);
      d.dayTasks.push(t);
      if (t.is_done) {
        d.tasksCount++;
        d.isActive = true;
      }
    });

    safeRoutineLogs.filter((l) => l && l.user_id === uid && l.log_date).forEach((l) => {
      const d = getOrInit(l.log_date);
      d.routineCount++;
      d.isActive = true;
      const matchedRoutine = safeRoutines.find((r) => r.id === l.routine_id) || {
        id: l.routine_id,
        user_id: l.user_id,
        goal_id: null,
        title: "Habit Routine",
        emoji: "⚡",
        description: null,
        is_public: true,
        created_at: l.created_at,
      };
      d.dayRoutines.push({ routine: matchedRoutine, log: l });
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

    // Add important events to map
    safeEvents.forEach((ev) => {
      if (ev && ev.event_date) {
        const d = getOrInit(ev.event_date);
        d.dayEvents.push(ev);
      }
    });

    return map;
  }, [selectedUser, safeTasks, safeRoutines, safeRoutineLogs, safeCheckins, safeStudy, safeWeight, userStreak, safeEvents]);

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

  // Upcoming events
  const upcomingEvents = useMemo(() => {
    return safeEvents
      .filter((e) => e && e.event_date >= todayStr)
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
      .slice(0, 5);
  }, [safeEvents, todayStr]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !currentUser) return;
    setEventLoading(true);

    try {
      await supabase.from("important_events").insert([{
        user_id: currentUser.id,
        title: eventTitle.trim(),
        event_date: eventDate,
        category: eventCategory,
        description: eventDesc.trim() || null,
      }]);

      await supabase.from("activity_feed").insert([{
        user_id: currentUser.id,
        type: "note_shared",
        content: `🎓 ${currentUser.username} scheduled an important event: "${eventTitle.trim()}" on ${eventDate}`,
      }]);

      setEventTitle("");
      setEventDesc("");
      setShowAddEvent(false);
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setEventLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    await supabase.from("important_events").delete().eq("id", id);
    if (onRefreshEvents) onRefreshEvents();
  };

  const getDaysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) / 86400000);
    if (diff === 0) return "Today!";
    if (diff === 1) return "Tomorrow";
    return `In ${diff} days`;
  };

  const navigateDetailDay = (offset: number) => {
    if (!selectedDayDetail) return;
    const d = new Date(selectedDayDetail.dateStr + "T12:00:00");
    d.setDate(d.getDate() + offset);
    const nextDateStr = d.toISOString().split("T")[0];
    const nextDetail = activityMap.get(nextDateStr) || {
      tasksCount: 0,
      studyMinutes: 0,
      gymCount: 0,
      routineCount: 0,
      checkinCount: 0,
      isFrozen: false,
      isActive: false,
      dayEvents: [],
      dayTasks: [],
      dayRoutines: [],
    };
    setSelectedDayDetail({ dateStr: nextDateStr, detail: nextDetail });
  };

  const [newDayTaskTitle, setNewDayTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  const handleToggleTask = async (task: Task) => {
    const newStatus = !task.is_done;
    await supabase.from("tasks").update({ is_done: newStatus }).eq("id", task.id);
    if (onRefreshEvents) onRefreshEvents();
  };

  const handleToggleRoutine = async (routineId: string, logDate: string) => {
    if (!selectedUser) return;
    const existing = safeRoutineLogs.find(
      (l) => l.routine_id === routineId && l.user_id === selectedUser.id && l.log_date === logDate
    );
    if (existing) {
      await supabase.from("routine_logs").delete().eq("id", existing.id);
    } else {
      await supabase.from("routine_logs").insert([
        { routine_id: routineId, user_id: selectedUser.id, log_date: logDate },
      ]);
    }
    if (onRefreshEvents) onRefreshEvents();
  };

  const handleAddDayTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDayTaskTitle.trim() || !selectedUser || !selectedDayDetail) return;
    setAddingTask(true);
    try {
      await supabase.from("tasks").insert([
        {
          title: newDayTaskTitle.trim(),
          user_id: selectedUser.id,
          is_done: false,
          task_date: selectedDayDetail.dateStr,
        },
      ]);
      setNewDayTaskTitle("");
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingTask(false);
    }
  };

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

      {/* Header with Title & Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-400"
            style={{ background: "rgba(245, 197, 24, 0.15)", border: "1px solid rgba(245, 197, 24, 0.3)" }}
          >
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Monthly Streaks & Exams</h3>
            <p className="text-[10px] text-gray-400">Fire streak icons & milestone schedule</p>
          </div>
        </div>

        {/* Action: Add Important Date / Exam */}
        <div className="flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowAddEvent(!showAddEvent)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
          >
            <Plus className="w-3 h-3" />
            <span>Add Exam / Date</span>
          </motion.button>
        </div>
      </div>

      {/* Member Selector Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
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
              className="px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all"
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
          <p className="text-[9px] font-bold text-gray-400 uppercase">Active</p>
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

      {/* Add Exam / Milestone Modal */}
      <AnimatePresence>
        {showAddEvent && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddEvent}
            className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/40 space-y-3 overflow-hidden text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-white flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-amber-400" /> Schedule Important Date / Exam
              </span>
              <button
                type="button"
                onClick={() => setShowAddEvent(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <input
                type="text"
                required
                placeholder="e.g. Operating Systems Endterm Exam, Google Online Assessment"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="input-field py-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-400">Date</label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="input-field py-1 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400">Category</label>
                <select
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value as ImportantEvent["category"])}
                  className="input-field py-1 text-xs mt-1"
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={eventLoading}
              className="w-full py-2 rounded-xl text-xs font-black text-black flex items-center justify-center gap-1.5"
              style={{ background: "#f5c518" }}
            >
              <Plus className="w-3.5 h-3.5" />
              {eventLoading ? "Saving..." : "Save to Calendar"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

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

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={jumpToCurrentMonth}
            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-bold text-gray-300 hover:text-white transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend & Summary of Month */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1 text-[10px] text-gray-400">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Tasks Done
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Habits Done
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" /> Streak Day
          </span>
        </div>
        <span className="font-semibold text-gray-400">
          {monthStats.activeDaysCount}/{monthStats.totalDaysInMonth} active days ({monthStats.pct}%)
        </span>
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
              return <div key={`empty-${idx}`} className="h-14 rounded-xl bg-white/[0.01]" />;
            }

            const isToday = cell.dateStr === todayStr;
            const detail = activityMap.get(cell.dateStr);
            const tasksDone = detail?.tasksCount || 0;
            const habitsDone = detail?.routineCount || 0;
            const hasTasksOrHabits = tasksDone > 0 || habitsDone > 0;
            const isActive = Boolean(detail?.isActive);
            const isFrozen = Boolean(detail?.isFrozen);
            const hasEvents = (detail?.dayEvents || []).length > 0;
            const isSelected = selectedDayDetail?.dateStr === cell.dateStr;

            return (
              <motion.button
                key={cell.dateStr}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  const dayDet = detail || {
                    tasksCount: 0,
                    studyMinutes: 0,
                    gymCount: 0,
                    routineCount: 0,
                    checkinCount: 0,
                    isFrozen: false,
                    isActive: false,
                    dayEvents: [],
                    dayTasks: [],
                    dayRoutines: [],
                  };
                  setSelectedDayDetail({ dateStr: cell.dateStr, detail: dayDet });
                }}
                className="h-14 rounded-xl flex flex-col items-center justify-between p-1 transition-all relative overflow-hidden"
                style={{
                  background: isSelected
                    ? "rgba(245, 197, 24, 0.25)"
                    : hasEvents
                    ? "linear-gradient(180deg, #24160d, #141118)"
                    : hasTasksOrHabits
                    ? "linear-gradient(180deg, #181d19, #131218)"
                    : isActive
                    ? "linear-gradient(180deg, #1f1710, #161219)"
                    : "rgba(255, 255, 255, 0.03)",
                  border: `1.5px solid ${
                    isSelected
                      ? "#f5c518"
                      : isToday
                      ? userColor
                      : hasEvents
                      ? "#f59e0b"
                      : hasTasksOrHabits
                      ? "rgba(124, 92, 252, 0.35)"
                      : isActive
                      ? "rgba(245, 197, 24, 0.35)"
                      : "rgba(255, 255, 255, 0.05)"
                  }`,
                  boxShadow: hasEvents
                    ? "0 0 10px -2px rgba(245, 158, 11, 0.4)"
                    : hasTasksOrHabits
                    ? "0 0 10px -3px rgba(124, 92, 252, 0.25)"
                    : "none",
                }}
              >
                {/* Day number & Event dot */}
                <div className="w-full flex items-center justify-between px-0.5">
                  <span
                    className="text-[10px] font-bold leading-none"
                    style={{
                      color: isToday ? userColor : (hasTasksOrHabits || isActive) ? "#ffffff" : "#666670",
                    }}
                  >
                    {cell.dayNum}
                  </span>

                  {hasEvents && (
                    <span className="text-[9px]" title={detail?.dayEvents[0]?.title}>
                      {EVENT_CATEGORIES.find((c) => c.id === detail?.dayEvents[0]?.category)?.emoji || "📌"}
                    </span>
                  )}
                </div>

                {/* Combined Tasks & Habits Visual Badges */}
                <div className="w-full flex items-center justify-center gap-0.5 my-auto">
                  {tasksDone > 0 && (
                    <span
                      className="text-[8px] font-black px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      title={`${tasksDone} tasks done`}
                    >
                      ✓{tasksDone}
                    </span>
                  )}
                  {habitsDone > 0 && (
                    <span
                      className="text-[8px] font-black px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      title={`${habitsDone} habits done`}
                    >
                      ⚡{habitsDone}
                    </span>
                  )}
                  {!hasTasksOrHabits && (
                    isFrozen ? (
                      <Snowflake className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : isActive ? (
                      <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                    )
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Activity & Events Details Sheet */}
      <AnimatePresence>
        {selectedDayDetail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 rounded-2xl bg-black/80 border border-amber-500/40 space-y-3 text-xs overflow-hidden"
          >
            {/* Header with Day Navigator */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => navigateDetailDay(-1)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {new Date(selectedDayDetail.dateStr + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => navigateDetailDay(1)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                  title="Next Day"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="text-[10px] text-gray-400 hover:text-white px-2 py-1 rounded-lg bg-white/5 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Events on this day */}
            {selectedDayDetail.detail.dayEvents.length > 0 && (
              <div className="space-y-1.5 pb-2 border-b border-white/10">
                <p className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">Scheduled Exams & Deadlines</p>
                {selectedDayDetail.detail.dayEvents.map((ev) => (
                  <div key={ev.id} className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">{ev.title}</p>
                      <p className="text-[10px] text-amber-300/80 capitalize">{ev.category}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-1 rounded-lg text-gray-400 hover:text-red-400"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Summary badges */}
            <div className="flex flex-wrap gap-2 text-[11px] text-gray-300 pb-2 border-b border-white/10">
              {selectedDayDetail.detail.tasksCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <CheckSquare className="w-3 h-3" />
                  <span>{selectedDayDetail.detail.tasksCount} Tasks Done</span>
                </div>
              )}
              {selectedDayDetail.detail.routineCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Sparkles className="w-3 h-3" />
                  <span>{selectedDayDetail.detail.routineCount} Habits Done</span>
                </div>
              )}
              {selectedDayDetail.detail.studyMinutes > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <BookOpen className="w-3 h-3" />
                  <span>{selectedDayDetail.detail.studyMinutes}m Study Time</span>
                </div>
              )}
              {selectedDayDetail.detail.gymCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400">
                  <Dumbbell className="w-3 h-3" />
                  <span>Gym Check-in Done</span>
                </div>
              )}
              {selectedDayDetail.detail.isFrozen && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Snowflake className="w-3 h-3" />
                  <span>Streak Protected</span>
                </div>
              )}
            </div>

            {/* 1. TASKS SECTION FOR THIS DAY */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <CheckSquare className="w-3 h-3 text-emerald-400" />
                  Tasks on this Date ({selectedDayDetail.detail.dayTasks.length})
                </p>
              </div>

              {/* Tasks List */}
              {selectedDayDetail.detail.dayTasks.length === 0 ? (
                <p className="text-[11px] text-gray-500 italic py-0.5">No tasks recorded for this date.</p>
              ) : (
                <div className="space-y-1">
                  {selectedDayDetail.detail.dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-2 hover:bg-white/[0.05] transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTask(t)}
                        className="flex items-center gap-2 min-w-0 text-left flex-1"
                      >
                        <div
                          className="w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors"
                          style={{
                            background: t.is_done ? "#22c55e" : "rgba(255, 255, 255, 0.1)",
                            border: `1px solid ${t.is_done ? "#22c55e" : "rgba(255, 255, 255, 0.2)"}`,
                          }}
                        >
                          {t.is_done && <Check className="w-3 h-3 text-black stroke-[3]" />}
                        </div>
                        <span
                          className="text-xs truncate font-medium"
                          style={{
                            color: t.is_done ? "#888899" : "#ffffff",
                            textDecoration: t.is_done ? "line-through" : "none",
                          }}
                        >
                          {t.title}
                        </span>
                      </button>
                      {t.due_time && (
                        <span className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded shrink-0">
                          {t.due_time}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Quick Add Task for this Day */}
              <form onSubmit={handleAddDayTask} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={newDayTaskTitle}
                  onChange={(e) => setNewDayTaskTitle(e.target.value)}
                  placeholder={`+ Add task for ${selectedDayDetail.dateStr}...`}
                  className="input-field py-1.5 text-xs flex-1"
                />
                <button
                  type="submit"
                  disabled={addingTask || !newDayTaskTitle.trim()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold transition-all disabled:opacity-30 shrink-0"
                >
                  Add
                </button>
              </form>
            </div>

            {/* 2. HABIT ROUTINES SECTION FOR THIS DAY */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Repeat2 className="w-3 h-3 text-purple-400" />
                Habit Routines on this Date
              </p>

              <div className="space-y-1">
                {safeRoutines.length === 0 ? (
                  <p className="text-[11px] text-gray-500 italic py-0.5">No habit routines created yet.</p>
                ) : (
                  safeRoutines.map((routine) => {
                    const isDone = safeRoutineLogs.some(
                      (l) =>
                        l.routine_id === routine.id &&
                        l.user_id === selectedUser?.id &&
                        l.log_date === selectedDayDetail.dateStr
                    );

                    return (
                      <div
                        key={routine.id}
                        className="p-2 rounded-xl border flex items-center justify-between gap-2 transition-all"
                        style={{
                          background: isDone ? "rgba(124, 92, 252, 0.12)" : "rgba(255, 255, 255, 0.02)",
                          borderColor: isDone ? "rgba(124, 92, 252, 0.35)" : "rgba(255, 255, 255, 0.06)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleRoutine(routine.id, selectedDayDetail.dateStr)}
                          className="flex items-center gap-2 min-w-0 text-left flex-1"
                        >
                          <div
                            className="w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors"
                            style={{
                              background: isDone ? "#7c5cfc" : "rgba(255, 255, 255, 0.1)",
                              border: `1px solid ${isDone ? "#7c5cfc" : "rgba(255, 255, 255, 0.2)"}`,
                            }}
                          >
                            {isDone && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                          <span className="text-base shrink-0">{routine.emoji || "⚡"}</span>
                          <span
                            className="text-xs font-semibold truncate"
                            style={{
                              color: isDone ? "#ffffff" : "#9999aa",
                              textDecoration: isDone ? "none" : "none",
                            }}
                          >
                            {routine.title}
                          </span>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {routine.reminder_time && (
                            <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                              {routine.reminder_time}
                            </span>
                          )}
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded transition-all"
                            style={{
                              background: isDone ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.05)",
                              color: isDone ? "#4ade80" : "#666",
                            }}
                          >
                            +10 XP
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming Milestones & Exams List */}
      {upcomingEvents.length > 0 && (
        <div className="pt-2 border-t border-white/5 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            Upcoming Exams & Milestones ({upcomingEvents.length})
          </p>

          <div className="space-y-1.5">
            {upcomingEvents.map((ev) => {
              const catObj = EVENT_CATEGORIES.find((c) => c.id === ev.category);
              return (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{catObj?.emoji || "📌"}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{ev.title}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(ev.event_date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          weekday: "short",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[9px] font-black px-2 py-0.5 rounded-md"
                      style={{
                        background: `${catObj?.color || "#f59e0b"}20`,
                        color: catObj?.color || "#f59e0b",
                      }}
                    >
                      {getDaysUntil(ev.event_date)}
                    </span>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-1 rounded-lg text-gray-500 hover:text-red-400"
                      title="Delete event"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
