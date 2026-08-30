"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Routine, RoutineLog, User, Goal } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Plus, Check, Trash2, Clock, Bell, Flame, Shield, User as UserIcon } from "lucide-react";

interface RoutineManagerProps {
  routines: Routine[];
  routineLogs: RoutineLog[];
  users: User[];
  currentUser: User;
  activeGoal: Goal | null;
  onRefresh: () => void;
}

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  pruthvi: "#7c5cfc",
  kevin: "#f5c518",
};

const CREW = ["rushil", "pruthvi", "kevin"];

const EMOJI_OPTIONS = [
  "⚡", "🏃", "💪", "📚", "🧘", "🥗", "💧", "😴", "🎯", "🔥",
  "🏋️", "🚴", "✍️", "🎸", "🧠", "🥊", "🏊", "🎨", "📖", "⏰"
];

function SwipeableRoutineItem({
  routine,
  isDone,
  streak,
  canManage,
  color,
  onToggle,
  onDelete,
}: {
  routine: Routine;
  isDone: boolean;
  streak: number;
  canManage: boolean;
  color: string;
  onToggle: (r: Routine) => void;
  onDelete: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const checkOpacity = useTransform(x, [0, 55], [0, 1]);
  const deleteOpacity = useTransform(x, [-55, 0], [1, 0]);
  const bg = useTransform(x, [-75, 0, 75], ["#2a0d0d", "#141418", `${color}18`]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (!canManage) return;
    if (info.offset.x > 60) {
      onToggle(routine);
    } else if (info.offset.x < -60) {
      onDelete(routine.id);
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
          <Trash2 className="w-5 h-5 text-red-500" />
        </motion.div>
      </div>

      <motion.div
        drag={canManage ? "x" : false}
        dragConstraints={{ left: -80, right: 80 }}
        dragElastic={0.25}
        style={{ x, backgroundColor: bg }}
        onDragEnd={handleDragEnd}
        className="flex items-center gap-3 px-3.5 py-3 relative z-10"
        whileTap={{ scale: 0.99 }}
      >
        {/* Toggle button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => canManage && onToggle(routine)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all cursor-pointer"
          style={{
            background: isDone ? color : "#1a1a20",
            border: `1.5px solid ${isDone ? color : "#2e2e38"}`,
          }}
        >
          {isDone ? <Check className="w-5 h-5 text-black stroke-[3]" /> : <span>{routine.emoji}</span>}
        </motion.button>

        {/* Title and details */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-snug"
            style={{
              color: isDone ? "#666" : "#ffffff",
              textDecoration: isDone ? "line-through" : "none",
            }}
          >
            {routine.title}
          </p>

          <div className="flex items-center gap-2 mt-1">
            {routine.reminder_time && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                <Clock className="w-2.5 h-2.5" />
                {routine.reminder_time}
              </span>
            )}
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              +10 XP
            </span>
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                <Flame className="w-3 h-3" />
                {streak}d streak
              </span>
            )}
          </div>
        </div>

        {/* Delete button */}
        {canManage && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(routine.id);
            }}
            className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
            title="Delete routine"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </div>
  );
}

export function RoutineManager({
  routines = [],
  routineLogs = [],
  users = [],
  currentUser,
  activeGoal,
  onRefresh,
}: RoutineManagerProps) {
  const isLeader = currentUser?.username?.toLowerCase() === "rushil" || currentUser?.role === "leader";

  const [selected, setSelected] = useState<string>(() => currentUser?.username?.toLowerCase() || "rushil");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [emoji, setEmoji] = useState("⚡");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [reminderTime, setReminderTime] = useState("08:00");
  const [enableReminder, setEnableReminder] = useState(true);
  const [assignedUserId, setAssignedUserId] = useState<string>(() => currentUser?.id || "");

  const todayStr = new Date().toISOString().split("T")[0];

  const safeRoutines = routines || [];
  const safeLogs = routineLogs || [];
  const safeUsers = users || [];

  const selectedUser = safeUsers.find((u) => u && u.username && u.username.toLowerCase() === selected) || currentUser;
  const isSelf = selectedUser?.id === currentUser?.id;
  const canManage = isSelf || isLeader;

  // Filter routines for selected user
  const userRoutines = safeRoutines.filter((r) => r && r.user_id === selectedUser?.id);

  // Set of completed routine IDs today for selected user
  const todayCompletedIds = useMemo(() => {
    return new Set(
      safeLogs
        .filter((l) => l && l.user_id === selectedUser?.id && l.log_date === todayStr)
        .map((l) => l.routine_id)
    );
  }, [safeLogs, selectedUser?.id, todayStr]);

  // Calculate habit streak
  const getStreak = (routineId: string, userId: string) => {
    const logs = safeLogs
      .filter((l) => l && l.routine_id === routineId && l.user_id === userId)
      .map((l) => l.log_date)
      .sort()
      .reverse();

    if (!logs.length) return 0;
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (const dateStr of logs) {
      const d = new Date(dateStr + "T00:00:00");
      const diff = Math.round((cursor.getTime() - d.getTime()) / 86400000);
      if (diff === 0 || diff === 1) {
        streak++;
        cursor.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  };

  const handleToggle = async (routine: Routine) => {
    const isDone = todayCompletedIds.has(routine.id);
    const targetUserId = routine.user_id;

    if (isDone) {
      await supabase
        .from("routine_logs")
        .delete()
        .eq("user_id", targetUserId)
        .eq("routine_id", routine.id)
        .eq("log_date", todayStr);
    } else {
      if ("vibrate" in navigator) navigator.vibrate(25);
      await supabase.from("routine_logs").insert([{
        user_id: targetUserId,
        routine_id: routine.id,
        log_date: todayStr,
      }]);

      await supabase.from("activity_feed").insert([{
        user_id: currentUser.id,
        type: "routine_done",
        content: `${currentUser.username} completed habit: ${routine.emoji} ${routine.title}`,
      }]);
    }
    onRefresh();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentUser) return;
    setLoading(true);

    try {
      const targetUserId = isLeader && assignedUserId ? assignedUserId : currentUser.id;

      await supabase.from("routines").insert([{
        user_id: targetUserId,
        title: title.trim(),
        emoji,
        description: desc.trim() || null,
        reminder_time: enableReminder ? reminderTime : null,
        is_public: true,
      }]);

      setShowCreate(false);
      setTitle("");
      setDesc("");
      setEmoji("⚡");
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("routines").delete().eq("id", id);
    onRefresh();
  };

  const doneCount = userRoutines.filter((r) => todayCompletedIds.has(r.id)).length;
  const color = USER_COLORS[selected] || "#888";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">Habits & Routines</h2>
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

        {canManage && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowCreate(!showCreate)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="New habit routine"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Member Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CREW.map((uname) => {
          const isSelected = selected === uname;
          const uObj = safeUsers.find((u) => u && u.username && u.username.toLowerCase() === uname);
          const uColor = USER_COLORS[uname];
          const uRoutines = safeRoutines.filter((r) => r && r.user_id === uObj?.id);
          const uDone = uRoutines.filter((r) => todayCompletedIds.has(r.id)).length;

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
                {uDone}/{uRoutines.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Routine Creation Drawer */}
      <AnimatePresence>
        {showCreate && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="card p-4 space-y-3 overflow-hidden border border-purple-500/30"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-white">Create New Daily Habit</p>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            {/* Emoji picker */}
            <div className="flex gap-1.5 overflow-x-auto py-1">
              {EMOJI_OPTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 transition-transform"
                  style={{
                    background: emoji === em ? "#7c5cfc30" : "#1a1a20",
                    border: `1px solid ${emoji === em ? "#7c5cfc" : "#282830"}`,
                  }}
                >
                  {em}
                </button>
              ))}
            </div>

            <div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 50 pushups, 2L water, Read 10 pages"
                className="input-field"
              />
            </div>

            {/* Reminder Time Picker */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-semibold text-gray-300">Daily Reminder Time</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableReminder}
                  onChange={(e) => setEnableReminder(e.target.checked)}
                  className="rounded"
                />
              </div>

              {enableReminder && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="input-field py-1.5 text-xs font-semibold text-white"
                  />
                  <span className="text-[10px] text-gray-400">Push notification at this time</span>
                </div>
              )}
            </div>

            {/* Assignee if Rushil */}
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
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              {loading ? "Creating..." : "Save Routine"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Routine items list */}
      <div className="space-y-2">
        {userRoutines.length === 0 ? (
          <div className="p-7 text-center rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-gray-500">
            No routines set up for {selected}. Tap + to create one!
          </div>
        ) : (
          userRoutines.map((routine) => {
            const isDone = todayCompletedIds.has(routine.id);
            const streak = getStreak(routine.id, routine.user_id);

            return (
              <SwipeableRoutineItem
                key={routine.id}
                routine={routine}
                isDone={isDone}
                streak={streak}
                canManage={canManage}
                color={color}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
