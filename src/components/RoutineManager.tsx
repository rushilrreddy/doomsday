"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Routine, RoutineLog, User, Goal } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Plus, Check, Trash2, Link2, X, ChevronDown, Repeat2 } from "lucide-react";

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
  alan: "#7c5cfc",
  kevin: "#f5c518",
};
const CREW = ["rushil", "alan", "kevin"];

const EMOJI_OPTIONS = ["⚡","🏃","💪","📚","🧘","🥗","💧","😴","🎯","🔥","🏋️","🚴","✍️","🎸","🧠","🥊","🏊","🎨","📖","⏰"];

export function RoutineManager({ routines, routineLogs, users, currentUser, activeGoal, onRefresh }: RoutineManagerProps) {
  const [selected, setSelected] = useState(currentUser.username.toLowerCase());
  const [showCreate, setShowCreate] = useState(false);
  const [showCrewRoutines, setShowCrewRoutines] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form
  const [emoji, setEmoji] = useState("⚡");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [linkGoal, setLinkGoal] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const selectedUser = users.find((u) => u.username.toLowerCase() === selected) || currentUser;
  const isSelf = selectedUser.id === currentUser.id;
  const myColor = USER_COLORS[currentUser.username.toLowerCase()] || "#888";

  // Routines for selected user
  const userRoutines = useMemo(
    () => routines.filter((r) => r.user_id === selectedUser.id && (isSelf || r.is_public)),
    [routines, selectedUser.id, isSelf]
  );

  // Today's log set
  const todayLogSet = useMemo(
    () => new Set(routineLogs.filter((l) => l.log_date === todayStr && l.user_id === selectedUser.id).map((l) => l.routine_id)),
    [routineLogs, todayStr, selectedUser.id]
  );

  // Streak for a routine
  const getStreak = (routineId: string, userId: string) => {
    const logs = routineLogs
      .filter((l) => l.routine_id === routineId && l.user_id === userId)
      .map((l) => l.log_date)
      .sort()
      .reverse();
    if (!logs.length) return 0;
    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (const dateStr of logs) {
      const d = new Date(dateStr + "T00:00:00");
      const diff = Math.round((cursor.getTime() - d.getTime()) / 86400000);
      if (diff === 0 || diff === 1) { streak++; cursor = d; }
      else break;
    }
    return streak;
  };

  const handleToggle = async (routine: Routine) => {
    if (!isSelf) return;
    const isDone = todayLogSet.has(routine.id);
    if (isDone) {
      await supabase.from("routine_logs").delete()
        .eq("user_id", currentUser.id)
        .eq("routine_id", routine.id)
        .eq("log_date", todayStr);
    } else {
      if ("vibrate" in navigator) navigator.vibrate(25);
      await supabase.from("routine_logs").insert([{
        user_id: currentUser.id, routine_id: routine.id, log_date: todayStr,
      }]);
      await supabase.from("activity_feed").insert([{
        user_id: currentUser.id, type: "routine_done",
        content: `${currentUser.username} completed routine: ${routine.emoji} ${routine.title}`,
      }]);
    }
    onRefresh();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await supabase.from("routines").insert([{
        user_id: currentUser.id,
        goal_id: linkGoal && activeGoal ? activeGoal.id : null,
        title: title.trim(),
        emoji,
        description: desc.trim() || null,
        is_public: true,
      }]);
      setShowCreate(false); setTitle(""); setDesc(""); setEmoji("⚡"); setLinkGoal(false);
      onRefresh();
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("routines").delete().eq("id", id);
    onRefresh();
  };

  const doneCount = userRoutines.filter((r) => todayLogSet.has(r.id)).length;
  const color = USER_COLORS[selected] || "#888";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>Routines</h2>
          <p className="text-xs mt-0.5" style={{ color: "#555" }}>Daily habits — recurring every day</p>
        </div>
        {isSelf && (
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => setShowCreate(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: myColor }}>
            <Plus className="w-4 h-4" style={{ color: "#0a0a0a" }} />
          </motion.button>
        )}
      </div>

      {/* Friend tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CREW.map((uname) => {
          const c = USER_COLORS[uname];
          const active = selected === uname;
          const u = users.find((usr) => usr.username.toLowerCase() === uname);
          const uRoutines = routines.filter((r) => r.user_id === u?.id && (u?.id === currentUser.id || r.is_public));
          const uDone = uRoutines.filter((r) => routineLogs.some(
            (l) => l.routine_id === r.id && l.log_date === todayStr && l.user_id === u?.id
          )).length;
          return (
            <motion.button key={uname} whileTap={{ scale: 0.95 }}
              onClick={() => setSelected(uname)}
              className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl text-xs font-bold capitalize"
              style={{
                background: active ? `${c}15` : "#161616",
                border: active ? `1px solid ${c}35` : "1px solid #222",
                color: active ? c : "#666",
              }}>
              <span>{uname}</span>
              <span className="text-[10px]" style={{ color: active ? c : "#444" }}>
                {uDone}/{uRoutines.length}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Progress bar */}
      {userRoutines.length > 0 && (
        <div className="card p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold capitalize" style={{ color: "#f0f0f0" }}>
              {selected}&apos;s routines today
            </p>
            <span className="text-xs font-black tabular-nums"
              style={{ color: doneCount === userRoutines.length && userRoutines.length > 0 ? "#22c55e" : "#f0f0f0" }}>
              {doneCount}/{userRoutines.length}
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "#222" }}>
            <motion.div
              animate={{ width: userRoutines.length ? `${(doneCount / userRoutines.length) * 100}%` : "0%" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: color }}
            />
          </div>
        </div>
      )}

      {/* Routine list */}
      <div className="space-y-2">
        {userRoutines.length === 0 ? (
          <div className="card p-7 text-center space-y-2">
            <Repeat2 className="w-6 h-6 mx-auto" style={{ color: "#333" }} />
            <p className="text-sm" style={{ color: "#444" }}>
              {isSelf ? "No routines yet. Add your daily habits!" : `${selected} hasn't added routines yet.`}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {userRoutines.map((routine) => {
              const done = todayLogSet.has(routine.id);
              const streak = getStreak(routine.id, selectedUser.id);
              return (
                <motion.div key={routine.id} layout
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                  style={{
                    background: done ? `${color}0a` : "#161616",
                    border: `1px solid ${done ? `${color}25` : "#222"}`,
                  }}>
                  {/* Checkbox */}
                  <motion.button whileTap={{ scale: 0.8 }}
                    onClick={() => handleToggle(routine)}
                    disabled={!isSelf}
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-base"
                    style={{
                      background: done ? color : "#1c1c1c",
                      border: `1px solid ${done ? color : "#333"}`,
                    }}>
                    {done ? (
                      <Check className="w-3.5 h-3.5" style={{ color: "#0a0a0a" }} />
                    ) : (
                      <span style={{ fontSize: 14, lineHeight: 1 }}>{routine.emoji}</span>
                    )}
                  </motion.button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold"
                        style={{ color: done ? "#666" : "#f0f0f0", textDecoration: done ? "line-through" : "none" }}>
                        {routine.emoji} {routine.title}
                      </span>
                      {routine.goal_id && (
                        <Link2 className="w-3 h-3 shrink-0" style={{ color: "#7c5cfc" }} />
                      )}
                    </div>
                    {streak > 0 && (
                      <p className="text-[10px] font-bold mt-0.5" style={{ color: done ? color : "#444" }}>
                        🔥 {streak} day streak
                      </p>
                    )}
                  </div>

                  {/* Delete (self only) */}
                  {isSelf && (
                    <button onClick={() => handleDelete(routine.id)} className="btn-ghost p-1.5 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "#333" }} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Crew routines toggle (when viewing self) */}
      {isSelf && routines.filter((r) => r.user_id !== currentUser.id && r.is_public).length > 0 && (
        <>
          <button onClick={() => setShowCrewRoutines(!showCrewRoutines)}
            className="flex items-center gap-2 text-xs font-semibold w-full"
            style={{ color: "#555" }}>
            <motion.div animate={{ rotate: showCrewRoutines ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
            Crew routines (read-only)
          </button>
          <AnimatePresence>
            {showCrewRoutines && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                {CREW.filter((u) => u !== selected).map((uname) => {
                  const u = users.find((usr) => usr.username.toLowerCase() === uname);
                  const uRoutines = routines.filter((r) => r.user_id === u?.id && r.is_public);
                  if (!uRoutines.length) return null;
                  const c = USER_COLORS[uname];
                  return (
                    <div key={uname} className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: "#444" }}>
                        {uname}
                      </p>
                      {uRoutines.map((r) => {
                        const isLoggedByThem = routineLogs.some(
                          (l) => l.routine_id === r.id && l.log_date === todayStr && l.user_id === u?.id
                        );
                        return (
                          <div key={r.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                            style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                            <span className="text-base">{r.emoji}</span>
                            <span className="flex-1 text-xs font-medium" style={{ color: "#888" }}>{r.title}</span>
                            {isLoggedByThem && (
                              <span className="text-xs font-bold" style={{ color: c }}>✓ Done</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Create Routine Sheet */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.72)" }} onClick={() => setShowCreate(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
              style={{ background: "#161616", border: "1px solid #252525", borderBottom: "none",
                paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>
              <div className="w-8 h-1 rounded-full mx-auto" style={{ background: "#2a2a2a" }} />
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base" style={{ color: "#f0f0f0" }}>New Routine</h3>
                <button onClick={() => setShowCreate(false)}>
                  <X className="w-4 h-4" style={{ color: "#555" }} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Emoji picker */}
                <div>
                  <p className="text-[11px] font-semibold mb-2" style={{ color: "#666" }}>Pick an emoji</p>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_OPTIONS.map((e) => (
                      <button key={e} type="button" onClick={() => setEmoji(e)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                        style={{
                          background: emoji === e ? `${myColor}20` : "#1c1c1c",
                          border: `1px solid ${emoji === e ? myColor : "#252525"}`,
                        }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold mb-1.5" style={{ color: "#666" }}>Title</p>
                  <input required value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Morning Run" className="input-field" />
                </div>

                <div>
                  <p className="text-[11px] font-semibold mb-1.5" style={{ color: "#666" }}>Description (optional)</p>
                  <input value={desc} onChange={(e) => setDesc(e.target.value)}
                    placeholder="Any details..." className="input-field" />
                </div>

                {/* Link to challenge */}
                {activeGoal && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => setLinkGoal(!linkGoal)}
                      className="w-9 h-5 rounded-full relative"
                      style={{ background: linkGoal ? "#7c5cfc" : "#2a2a2a" }}>
                      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: linkGoal ? "calc(100% - 18px)" : "2px" }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "#f0f0f0" }}>
                        Link to challenge
                      </p>
                      <p className="text-[10px]" style={{ color: "#555" }}>
                        Shows a 🔗 badge · &quot;{activeGoal.title}&quot;
                      </p>
                    </div>
                  </label>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 text-sm">
                    {loading ? "Adding..." : "Add Routine"}
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
