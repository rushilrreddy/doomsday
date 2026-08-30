"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Task, User } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Check, Clock, Calendar, ChevronDown, ChevronUp, User as UserIcon, Shield, Layers, History, CalendarDays, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { AllDoneCelebration } from "./AllDoneCelebration";

interface TaskManagerProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onRefresh: () => void;
}

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  pruthvi: "#7c5cfc",
  kevin: "#f5c518",
};

const CREW = ["rushil", "pruthvi", "kevin"];

function SwipeableTask({
  task,
  owner,
  canManage,
  color,
  onToggle,
  onDelete,
}: {
  task: Task;
  owner?: User;
  canManage: boolean;
  color: string;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const checkOpacity = useTransform(x, [0, 60], [0, 1]);
  const deleteOpacity = useTransform(x, [-60, 0], [1, 0]);
  const bg = useTransform(x, [-80, 0, 80], ["#2a0d0d", "#151518", `${color}18`]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (!canManage) return;
    if (info.offset.x > 65) {
      onToggle(task);
    } else if (info.offset.x < -65) {
      onDelete(task.id);
    }
    x.set(0);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ border: "1px solid #232328" }}>
      {/* Background swipe hints */}
      <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none">
        <motion.div style={{ opacity: checkOpacity }}>
          <Check className="w-5 h-5" style={{ color }} />
        </motion.div>
        <motion.div style={{ opacity: deleteOpacity }}>
          <Trash2 className="w-5 h-5" style={{ color: "#ef4444" }} />
        </motion.div>
      </div>

      <motion.div
        drag={canManage ? "x" : false}
        dragConstraints={{ left: -90, right: 90 }}
        dragElastic={0.25}
        style={{ x, backgroundColor: bg }}
        onDragEnd={handleDragEnd}
        className="flex items-center gap-3 px-3.5 py-3 relative z-10"
        whileTap={{ scale: 0.99 }}
      >
        {/* Checkbox button */}
        <motion.button
          whileTap={{ scale: 0.82 }}
          onClick={() => canManage && onToggle(task)}
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer"
          style={{
            background: task.is_done ? color : "transparent",
            border: `2px solid ${task.is_done ? color : "#3a3a40"}`,
          }}
        >
          {task.is_done && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
        </motion.button>

        {/* Task Title and Details */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium leading-snug transition-all"
            style={{
              color: task.is_done ? "#555" : "#ffffff",
              textDecoration: task.is_done ? "line-through" : "none",
            }}
          >
            {task.title}
          </p>

          {/* Badges row: Assigned Member, Time, Date */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {owner && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.2 rounded-md capitalize"
                style={{
                  background: `${USER_COLORS[owner.username.toLowerCase()] || "#888"}20`,
                  color: USER_COLORS[owner.username.toLowerCase()] || "#888",
                }}
              >
                {owner.username}
              </span>
            )}

            {task.due_time && (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded-md">
                <Clock className="w-2.5 h-2.5" />
                {task.due_time}
              </span>
            )}

            {task.task_date ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-gray-400 bg-white/5 px-1.5 py-0.2 rounded-md">
                <Calendar className="w-2.5 h-2.5" />
                {task.task_date === new Date().toISOString().split("T")[0] ? "Today" : task.task_date}
              </span>
            ) : (
              <span className="text-[9px] font-semibold text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                General
              </span>
            )}
          </div>
        </div>

        {/* Direct Delete Trash Button (Mistake correction) */}
        {canManage && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
            title="Delete task (XP deducted)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </div>
  );
}

export function TaskManager({ tasks = [], users = [], currentUser, onRefresh }: TaskManagerProps) {
  const isLeader = currentUser?.username?.toLowerCase() === "rushil" || currentUser?.role === "leader";

  // Selected filter: "all" (for Rushil) or specific username
  const [selected, setSelected] = useState<string>(() => currentUser?.username?.toLowerCase() || "rushil");
  const [showGeneralTasks, setShowGeneralTasks] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyDate, setHistoryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  });

  // Form states
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [assignedUserId, setAssignedUserId] = useState<string>(() => currentUser?.id || "");
  const [taskTimingType, setTaskTimingType] = useState<"today" | "custom_date" | "general">("today");
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dueTime, setDueTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const safeTasks = tasks || [];
  const safeUsers = users || [];

  // Filter tasks
  const isAllView = isLeader && selected === "all";
  const selectedUser = safeUsers.find((u) => u && u.username && u.username.toLowerCase() === selected) || currentUser;

  // Filter for Today / Specific Date tasks
  const datedTasks = safeTasks.filter((t) => {
    if (!t) return false;
    const matchesUser = isAllView ? true : t.user_id === selectedUser?.id;
    const hasDate = Boolean(t.task_date);
    return matchesUser && hasDate;
  });

  const todayTasks = datedTasks.filter((t) => t.task_date === todayStr);
  const futureTasks = datedTasks.filter((t) => t.task_date && t.task_date > todayStr);

  // Past tasks for the selected history date
  const pastTasks = datedTasks.filter((t) => t.task_date === historyDate);
  const donePast = pastTasks.filter((t) => t.is_done).length;
  const pastPct = pastTasks.length > 0 ? Math.round((donePast / pastTasks.length) * 100) : 0;

  // List of unique past dates that have tasks for quick jumping
  const distinctPastDates = useMemo(() => {
    const dates = new Set<string>();
    datedTasks.forEach((t) => {
      if (t.task_date && t.task_date < todayStr) {
        dates.add(t.task_date);
      }
    });
    return Array.from(dates).sort().reverse().slice(0, 7);
  }, [datedTasks, todayStr]);

  // General tasks without dates
  const generalTasks = safeTasks.filter((t) => {
    if (!t) return false;
    const matchesUser = isAllView ? true : t.user_id === selectedUser?.id;
    return matchesUser && !t.task_date;
  });

  const doneToday = todayTasks.filter((t) => t.is_done).length;
  const pct = todayTasks.length > 0 ? Math.round((doneToday / todayTasks.length) * 100) : 0;
  const color = isAllView ? "#38bdf8" : USER_COLORS[selected] || "#888";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !currentUser) return;
    setLoading(true);

    try {
      const targetUserId = isLeader && assignedUserId ? assignedUserId : currentUser.id;
      let finalDate: string | null = todayStr;
      if (taskTimingType === "custom_date") finalDate = customDate;
      else if (taskTimingType === "general") finalDate = null;

      const { data, error } = await supabase.from("tasks").insert([{
        user_id: targetUserId,
        title: newTaskTitle.trim(),
        is_done: false,
        task_date: finalDate,
        due_time: dueTime.trim() || null,
        sort_order: safeTasks.length,
      }]).select().single();

      if (!error && data) {
        const targetUserObj = safeUsers.find((u) => u.id === targetUserId);
        const assignedName = targetUserObj ? targetUserObj.username : currentUser.username;

        await supabase.from("activity_feed").insert([{
          user_id: currentUser.id,
          type: "task_created",
          content: `${currentUser.username} added task for ${assignedName}: "${newTaskTitle.trim()}"`,
        }]);
      }

      setNewTaskTitle("");
      setDueTime("");
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (task: Task) => {
    const nextDone = !task.is_done;
    if (nextDone) {
      if ("vibrate" in navigator) navigator.vibrate(30);
      confetti({ particleCount: 35, spread: 45, origin: { y: 0.65 }, scalar: 0.7 });
    }

    await supabase.from("tasks").update({ is_done: nextDone }).eq("id", task.id);

    if (nextDone) {
      await supabase.from("activity_feed").insert([{
        user_id: currentUser.id,
        type: "task_done",
        content: `${currentUser.username} completed "${task.title}" ✅`,
      }]);

      const updatedToday = todayTasks.map((t) => (t.id === task.id ? { ...t, is_done: true } : t));
      if (updatedToday.every((t) => t.is_done) && updatedToday.length > 0) {
        setTimeout(() => setShowCelebration(true), 400);
      }

      // Update streak
      try {
        const { data: streak } = await supabase.from("streaks").select("*").eq("user_id", task.user_id).single();
        if (streak && streak.last_active_date !== todayStr) {
          const nc = (streak.current_streak || 0) + 1;
          await supabase.from("streaks").update({
            current_streak: nc,
            longest_streak: Math.max(nc, streak.longest_streak || 0),
            last_active_date: todayStr,
          }).eq("user_id", task.user_id);
        }
      } catch { /* ignore */ }
    }

    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if ("vibrate" in navigator) navigator.vibrate([20, 10, 20]);
    await supabase.from("tasks").delete().eq("id", id);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">Daily Tasks</h2>
            {isLeader && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Master Access
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Swipe right to complete, left to delete.
          </p>
        </div>

        {/* Progress pill */}
        {todayTasks.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
            <span className="text-xs font-black text-white tabular-nums">{doneToday}/{todayTasks.length}</span>
            <span className="text-[10px] font-bold text-emerald-400">({pct}%)</span>
          </div>
        )}
      </div>

      {/* Member Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {isLeader && (
          <button
            type="button"
            onClick={() => { setSelected("all"); setAssignedUserId(currentUser?.id || ""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
            style={{
              background: selected === "all" ? "#1e293b" : "#141416",
              border: `1px solid ${selected === "all" ? "#38bdf8" : "#222"}`,
              color: selected === "all" ? "#38bdf8" : "#777",
            }}
          >
            <Layers className="w-3.5 h-3.5" /> All Crew
          </button>
        )}

        {CREW.map((uname) => {
          const isSelected = selected === uname;
          const uObj = safeUsers.find((u) => u && u.username && u.username.toLowerCase() === uname);
          const uColor = USER_COLORS[uname];
          const uTodayTasks = safeTasks.filter((t) => t && t.user_id === uObj?.id && t.task_date === todayStr);
          const uDone = uTodayTasks.filter((t) => t.is_done).length;

          return (
            <button
              key={uname}
              type="button"
              onClick={() => {
                setSelected(uname);
                if (uObj) setAssignedUserId(uObj.id);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 capitalize"
              style={{
                background: isSelected ? `${uColor}18` : "#141416",
                border: `1px solid ${isSelected ? uColor : "#222"}`,
                color: isSelected ? "#ffffff" : "#777",
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: uColor }} />
              {uname}
              <span className="text-[10px] text-gray-400 font-normal">
                {uDone}/{uTodayTasks.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Task Creation Box */}
      <form onSubmit={handleAdd} className="card p-3.5 space-y-3">
        <div>
          <input
            type="text"
            required
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder={`Add task for ${isAllView ? "crew" : selected}...`}
            className="input-field"
          />
        </div>

        {/* Timing options: Today, Specific Date, or General */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex rounded-xl bg-black/40 p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => setTaskTimingType("today")}
              className="px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors"
              style={{
                background: taskTimingType === "today" ? "#22c55e" : "transparent",
                color: taskTimingType === "today" ? "#000" : "#888",
              }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setTaskTimingType("custom_date")}
              className="px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors"
              style={{
                background: taskTimingType === "custom_date" ? "#7c5cfc" : "transparent",
                color: taskTimingType === "custom_date" ? "#fff" : "#888",
              }}
            >
              Pick Date
            </button>
            <button
              type="button"
              onClick={() => setTaskTimingType("general")}
              className="px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors"
              style={{
                background: taskTimingType === "general" ? "#38bdf8" : "transparent",
                color: taskTimingType === "general" ? "#000" : "#888",
              }}
            >
              General / Backlog
            </button>
          </div>

          {/* Time Picker (Optional) */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-black/40 border border-white/10">
            <Clock className="w-3 h-3 text-purple-400" />
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="bg-transparent text-[11px] text-white focus:outline-none"
              title="Optional Time"
            />
          </div>
        </div>

        {/* Custom date picker input */}
        {taskTimingType === "custom_date" && (
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              required
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="input-field py-1 text-xs"
            />
          </div>
        )}

        {/* Rushil Master Assignee Selector */}
        {isLeader && (
          <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-xs">
            <span className="text-[11px] text-gray-400 font-semibold">Assign to:</span>
            <div className="flex gap-1.5">
              {safeUsers.map((u) => {
                const isTarget = assignedUserId === u.id;
                const uColor = USER_COLORS[u.username.toLowerCase()] || "#888";
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setAssignedUserId(u.id)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize transition-all"
                    style={{
                      background: isTarget ? uColor : "rgba(255,255,255,0.05)",
                      color: isTarget ? "#000" : "#888",
                    }}
                  >
                    {u.username}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          {loading ? "Adding Task..." : "Add Task"}
        </button>
      </form>

      {/* TODAY'S TASKS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Today&apos;s Schedule ({todayTasks.length})
          </p>
        </div>

        {todayTasks.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-gray-500">
            No tasks scheduled for today. Add one above!
          </div>
        ) : (
          todayTasks.map((t) => {
            const owner = safeUsers.find((u) => u.id === t.user_id);
            const canManage = isLeader || t.user_id === currentUser.id;
            return (
              <SwipeableTask
                key={t.id}
                task={t}
                owner={isAllView ? owner : undefined}
                canManage={canManage}
                color={owner ? USER_COLORS[owner.username.toLowerCase()] || "#22c55e" : "#22c55e"}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            );
          })
        )}
      </div>

      {/* GENERAL BACKLOG TASKS */}
      <div className="card p-3.5 space-y-2">
        <button
          type="button"
          onClick={() => setShowGeneralTasks(!showGeneralTasks)}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-300"
        >
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">📌</span>
            <span>General Tasks & Backlog ({generalTasks.length})</span>
          </div>
          {showGeneralTasks ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        <AnimatePresence>
          {showGeneralTasks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden pt-1"
            >
              {generalTasks.length === 0 ? (
                <p className="text-[11px] text-gray-500 text-center py-2">No general backlog tasks.</p>
              ) : (
                generalTasks.map((t) => {
                  const owner = safeUsers.find((u) => u.id === t.user_id);
                  const canManage = isLeader || t.user_id === currentUser.id;
                  return (
                    <SwipeableTask
                      key={t.id}
                      task={t}
                      owner={isAllView ? owner : undefined}
                      canManage={canManage}
                      color={owner ? USER_COLORS[owner.username.toLowerCase()] || "#22c55e" : "#22c55e"}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PREVIOUS DAYS COMPLETED TASKS & HISTORY */}
      <div className="card p-3.5 space-y-3" style={{ border: "1px solid rgba(124, 92, 252, 0.25)" }}>
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between text-xs font-bold text-white"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <span>Past Tasks History by Day</span>
          </div>
          <div className="flex items-center gap-2">
            {showHistory ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden pt-1"
            >
              {/* Date selection bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-gray-400 font-semibold">Quick Jump:</span>
                    {distinctPastDates.length > 0 ? (
                      distinctPastDates.map((dateStr) => {
                        const isSelected = historyDate === dateStr;
                        const d = new Date(dateStr + "T12:00:00");
                        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => setHistoryDate(dateStr)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                            style={{
                              background: isSelected ? "#7c5cfc" : "rgba(255, 255, 255, 0.05)",
                              color: isSelected ? "#ffffff" : "#999999",
                              border: `1px solid ${isSelected ? "#7c5cfc" : "rgba(255, 255, 255, 0.1)"}`,
                            }}
                          >
                            {label}
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-gray-500 italic">No past task records yet</span>
                    )}
                  </div>

                  {/* Specific Date Picker */}
                  <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10 shrink-0">
                    <CalendarDays className="w-3.5 h-3.5 text-purple-400" />
                    <input
                      type="date"
                      value={historyDate}
                      max={todayStr}
                      onChange={(e) => setHistoryDate(e.target.value)}
                      className="bg-transparent text-[11px] text-white focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Day Summary banner */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white">
                      {new Date(historyDate + "T12:00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-purple-300">
                    <span>{donePast}/{pastTasks.length} Completed</span>
                    {pastTasks.length > 0 && <span className="text-[10px] text-purple-400">({pastPct}%)</span>}
                  </div>
                </div>
              </div>

              {/* Tasks for the selected past date */}
              <div className="space-y-2">
                {pastTasks.length === 0 ? (
                  <div className="p-4 text-center rounded-xl bg-white/[0.02] border border-white/5 text-xs text-gray-500">
                    No tasks logged for {historyDate}.
                  </div>
                ) : (
                  pastTasks.map((t) => {
                    const owner = safeUsers.find((u) => u.id === t.user_id);
                    const canManage = isLeader || t.user_id === currentUser.id;
                    return (
                      <SwipeableTask
                        key={t.id}
                        task={t}
                        owner={isAllView ? owner : undefined}
                        canManage={canManage}
                        color={owner ? USER_COLORS[owner.username.toLowerCase()] || "#7c5cfc" : "#7c5cfc"}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                      />
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* All Done Celebration Modal */}
      <AllDoneCelebration
        show={showCelebration}
        username={selectedUser?.username || currentUser?.username || "Survivor"}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
}
