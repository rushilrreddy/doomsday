"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Task, User } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Check, AlertCircle } from "lucide-react";
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
  alan: "#7c5cfc",
  kevin: "#f5c518",
};

const CREW = ["rushil", "alan", "kevin"];

function SwipeableTask({
  task,
  isSelf,
  color,
  onToggle,
  onDelete,
}: {
  task: Task;
  isSelf: boolean;
  color: string;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const checkOpacity = useTransform(x, [0, 60], [0, 1]);
  const deleteOpacity = useTransform(x, [-60, 0], [1, 0]);
  const bg = useTransform(x, [-80, 0, 80], ["#2a0d0d", "#161616", `${color}18`]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (!isSelf) return;
    if (info.offset.x > 70) {
      onToggle(task);
    } else if (info.offset.x < -70) {
      onDelete(task.id);
    }
    x.set(0);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ border: "1px solid #222" }}>
      {/* Background hints */}
      <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none">
        <motion.div style={{ opacity: checkOpacity }}>
          <Check className="w-5 h-5" style={{ color }} />
        </motion.div>
        <motion.div style={{ opacity: deleteOpacity }}>
          <Trash2 className="w-5 h-5" style={{ color: "#ef4444" }} />
        </motion.div>
      </div>

      <motion.div
        drag={isSelf ? "x" : false}
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.3}
        style={{ x, backgroundColor: bg }}
        onDragEnd={handleDragEnd}
        className="flex items-center gap-3 px-4 py-3.5 relative z-10"
        whileTap={{ scale: 0.99 }}
      >
        {/* Tap checkbox */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => isSelf && onToggle(task)}
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all"
          style={{
            background: task.is_done ? color : "transparent",
            border: `2px solid ${task.is_done ? color : "#333"}`,
          }}
        >
          {task.is_done && <Check className="w-3 h-3" style={{ color: "#0a0a0a" }} />}
        </motion.button>

        <span
          className="flex-1 text-sm font-medium"
          style={{
            color: task.is_done ? "#444" : "#f0f0f0",
            textDecoration: task.is_done ? "line-through" : "none",
          }}
        >
          {task.title}
        </span>

        {isSelf && (
          <button onClick={() => onDelete(task.id)} className="btn-ghost p-1.5 shrink-0">
            <Trash2 className="w-3.5 h-3.5" style={{ color: "#333" }} />
          </button>
        )}
      </motion.div>
    </div>
  );
}

export function TaskManager({ tasks, users, currentUser, onRefresh }: TaskManagerProps) {
  const [selected, setSelected] = useState(currentUser.username.toLowerCase());
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const selectedUser = users.find((u) => u.username.toLowerCase() === selected) || currentUser;
  const isSelf = selectedUser.id === currentUser.id;
  const userTasks = tasks.filter((t) => t.user_id === selectedUser.id && t.task_date === todayStr);
  const done = userTasks.filter((t) => t.is_done).length;
  const pct = userTasks.length > 0 ? Math.round((done / userTasks.length) * 100) : 0;
  const color = USER_COLORS[selected] || "#888";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setLoading(true);
    try {
      await supabase.from("tasks").insert([{
        user_id: currentUser.id, title: newTask.trim(),
        is_done: false, task_date: todayStr, sort_order: userTasks.length,
      }]);
      await supabase.from("activity_feed").insert([{
        user_id: currentUser.id, type: "task_created",
        content: `${currentUser.username} added: "${newTask.trim()}"`,
      }]);
      setNewTask(""); onRefresh();
    } finally { setLoading(false); }
  };

  const handleToggle = async (task: Task) => {
    if (!isSelf) return;
    const nextDone = !task.is_done;
    if (nextDone) {
      // Haptic feedback
      if ("vibrate" in navigator) navigator.vibrate(30);
      confetti({ particleCount: 35, spread: 45, origin: { y: 0.65 }, scalar: 0.7 });
    }
    await supabase.from("tasks").update({ is_done: nextDone }).eq("id", task.id);
    if (nextDone) {
      await supabase.from("activity_feed").insert([{
        user_id: currentUser.id, type: "task_done",
        content: `${currentUser.username} completed "${task.title}" ✅`,
      }]);
      // Check if all tasks done after this one
      const updatedTasks = userTasks.map((t) => t.id === task.id ? { ...t, is_done: true } : t);
      if (updatedTasks.every((t) => t.is_done) && updatedTasks.length > 0) {
        setTimeout(() => setShowCelebration(true), 400);
      }
      // Streak update
      try {
        const { data: streak } = await supabase.from("streaks").select("*").eq("user_id", currentUser.id).single();
        if (streak && streak.last_active_date !== todayStr) {
          const nc = streak.current_streak + 1;
          await supabase.from("streaks").update({
            current_streak: nc, longest_streak: Math.max(nc, streak.longest_streak),
            last_active_date: todayStr,
          }).eq("user_id", currentUser.id);
          await supabase.from("activity_feed").insert([{
            user_id: currentUser.id, type: "streak_updated",
            content: `🔥 ${currentUser.username} is on a ${nc}-day streak!`,
          }]);
        }
      } catch { /* ignore */ }
    }
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!isSelf) return;
    if ("vibrate" in navigator) navigator.vibrate([20, 10, 20]);
    await supabase.from("tasks").delete().eq("id", id);
    onRefresh();
  };

  const getFriendPct = (uname: string) => {
    const u = users.find((usr) => usr.username.toLowerCase() === uname);
    if (!u) return 0;
    const t = tasks.filter((t) => t.user_id === u.id && t.task_date === todayStr);
    return t.length > 0 ? Math.round((t.filter((t) => t.is_done).length / t.length) * 100) : 0;
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>Daily Tasks</h2>
        <p className="text-xs mt-0.5" style={{ color: "#555" }}>
          Today · Swipe → to complete, ← to delete
        </p>
      </div>

      {/* Friend tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CREW.map((uname) => {
          const c = USER_COLORS[uname];
          const active = selected === uname;
          const fp = getFriendPct(uname);
          return (
            <motion.button key={uname} whileTap={{ scale: 0.95 }} onClick={() => setSelected(uname)}
              className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl text-xs font-bold capitalize"
              style={{
                background: active ? `${c}15` : "#161616",
                border: active ? `1px solid ${c}35` : "1px solid #222",
                color: active ? c : "#666",
              }}>
              <span>{uname}</span>
              <span className="text-[10px]" style={{ color: active ? c : "#444" }}>{fp}%</span>
            </motion.button>
          );
        })}
      </div>

      {/* Progress */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold capitalize" style={{ color: "#f0f0f0" }}>{selected}&apos;s day</p>
            <p className="text-xs mt-0.5" style={{ color: "#555" }}>{done}/{userTasks.length} done</p>
          </div>
          <span className="text-2xl font-black tabular-nums"
            style={{ color: pct === 100 ? "#22c55e" : "#f0f0f0" }}>
            {pct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#222" }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: color }}
          />
        </div>

        {isSelf && (
          <form onSubmit={handleAdd} className="flex gap-2 pt-1">
            <input value={newTask} onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a task for today..."
              className="input-field flex-1"
              style={{ borderRadius: 14, padding: "10px 14px", fontSize: 13 }} />
            <motion.button whileTap={{ scale: 0.92 }} type="submit" disabled={loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: color }}>
              <Plus className="w-4 h-4" style={{ color: "#0a0a0a" }} />
            </motion.button>
          </form>
        )}
      </div>

      {/* Tasks */}
      <div className="space-y-2">
        {userTasks.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-sm" style={{ color: "#444" }}>
              {isSelf ? "No tasks yet — add your first one!" : `${selected} hasn't added tasks today.`}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {userTasks.map((task) => (
              <motion.div key={task.id} layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}>
                <SwipeableTask
                  task={task}
                  isSelf={isSelf}
                  color={color}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Hint */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl"
        style={{ background: "#111", border: "1px solid #1a1a1a" }}>
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#555" }} />
        <p className="text-[11px] leading-relaxed" style={{ color: "#444" }}>
          Tasks carry over at midnight. Streak counts any day with at least one completion.
        </p>
      </div>

      <AllDoneCelebration
        show={showCelebration}
        username={currentUser.username}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
}
