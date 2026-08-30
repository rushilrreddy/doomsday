"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BodyWeightLog, User } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Dumbbell, Check, Flame, Plus, Scale, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface GymCheckinCardProps {
  logs: BodyWeightLog[];
  users: User[];
  currentUser: User;
  onRefresh: () => void;
}

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  pruthvi: "#7c5cfc",
  kevin: "#f5c518",
};

const WORKOUT_TYPES = [
  { id: "chest_triceps", label: "Chest & Triceps", emoji: "🏋️" },
  { id: "back_biceps",   label: "Back & Biceps",   emoji: "🦍" },
  { id: "legs",          label: "Leg Day",          emoji: "🦵" },
  { id: "cardio",        label: "Cardio / Run",     emoji: "🏃" },
  { id: "shoulders_abs", label: "Shoulders & Abs",  emoji: "💪" },
  { id: "full_body",     label: "Full Body",        emoji: "🔥" },
  { id: "recovery",      label: "Active Recovery",  emoji: "🧘" },
];

export function GymCheckinCard({ logs = [], users = [], currentUser, onRefresh }: GymCheckinCardProps) {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [workoutType, setWorkoutType] = useState(WORKOUT_TYPES[0].label);
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const safeLogs = logs || [];
  const safeUsers = users || [];

  // Check if current user has checked in to the gym today
  const myTodayLog = useMemo(
    () => safeLogs.find((l) => l && l.user_id === currentUser.id && l.log_date === todayStr),
    [safeLogs, currentUser.id, todayStr]
  );

  // Check crew status for today
  const crewStatus = useMemo(() => {
    return safeUsers.map((u) => {
      const log = safeLogs.find((l) => l && l.user_id === u.id && l.log_date === todayStr);
      return {
        user: u,
        checkedIn: Boolean(log),
        log,
      };
    });
  }, [safeUsers, safeLogs, todayStr]);

  const handleGymCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    try {
      const weightVal = weight ? parseFloat(weight) : 0;
      const finalNote = notes.trim()
        ? `[${workoutType}] ${notes.trim()}`
        : `[${workoutType}] Completed workout`;

      if (myTodayLog) {
        // Update existing log
        await supabase.from("body_weight_logs").update({
          weight: weightVal || myTodayLog.weight || 0,
          unit,
          note: finalNote,
        }).eq("id", myTodayLog.id);
      } else {
        // Insert new log (+20 XP!)
        await supabase.from("body_weight_logs").insert([{
          user_id: currentUser.id,
          log_date: todayStr,
          weight: weightVal,
          unit,
          note: finalNote,
        }]);

        await supabase.from("activity_feed").insert([{
          user_id: currentUser.id,
          type: "gym_checkin",
          content: `🏋️ ${currentUser.username} checked in at the Gym: "${workoutType}" (+20 XP)`,
        }]);

        // Trigger confetti
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      }

      setShowForm(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="card p-4 space-y-3.5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #181119, #0d0d12)",
        border: "1px solid rgba(236, 72, 153, 0.25)",
        boxShadow: "0 10px 30px -10px rgba(236, 72, 153, 0.15)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ background: "rgba(236, 72, 153, 0.15)", border: "1px solid rgba(236, 72, 153, 0.3)" }}
          >
            <Dumbbell className="w-4 h-4 text-pink-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">Daily Gym Check-in</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-pink-500/20 text-pink-400 border border-pink-500/30">
                +20 XP
              </span>
            </div>
            <p className="text-[10px] text-gray-400">Log your workout & track crew gym consistency</p>
          </div>
        </div>

        {/* Quick check-in button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          style={{
            background: myTodayLog ? "rgba(34, 197, 94, 0.2)" : "linear-gradient(135deg, #ec4899, #be185d)",
            color: myTodayLog ? "#4ade80" : "#ffffff",
            border: `1px solid ${myTodayLog ? "rgba(34, 197, 94, 0.4)" : "transparent"}`,
          }}
        >
          {myTodayLog ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{myTodayLog ? "Checked In" : "Log Gym"}</span>
        </motion.button>
      </div>

      {/* Crew Today's Gym Status Bar */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
        {crewStatus.map(({ user, checkedIn, log }) => {
          const color = USER_COLORS[user.username.toLowerCase()] || "#888";
          return (
            <div
              key={user.id}
              className="p-2 rounded-xl text-center space-y-1"
              style={{
                background: checkedIn ? `${color}15` : "rgba(255, 255, 255, 0.02)",
                border: `1px solid ${checkedIn ? `${color}35` : "rgba(255, 255, 255, 0.05)"}`,
              }}
            >
              <div className="flex items-center justify-center gap-1">
                <span className="text-[11px] font-bold capitalize text-white">{user.username}</span>
                {checkedIn && <span className="text-[10px] text-emerald-400 font-bold">✓</span>}
              </div>
              <p
                className="text-[10px] font-semibold truncate"
                style={{ color: checkedIn ? color : "#666" }}
              >
                {checkedIn ? (log?.note?.replace(/\[(.*?)\]/, "$1") || "Workout Done") : "Not logged"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Expandable Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleGymCheckin}
            className="space-y-3 pt-2 overflow-hidden border-t border-white/10"
          >
            {/* Workout Type Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-300">Workout Focus</label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {WORKOUT_TYPES.map((wt) => {
                  const active = workoutType === wt.label;
                  return (
                    <button
                      key={wt.id}
                      type="button"
                      onClick={() => setWorkoutType(wt.label)}
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 flex items-center gap-1.5 transition-all"
                      style={{
                        background: active ? "#ec4899" : "rgba(255, 255, 255, 0.05)",
                        color: active ? "#000000" : "#9ca3af",
                        border: `1px solid ${active ? "#ec4899" : "rgba(255, 255, 255, 0.08)"}`,
                      }}
                    >
                      <span>{wt.emoji}</span>
                      <span>{wt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Weight & Notes */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-400">Body Weight (Optional)</label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 74.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="input-field py-1.5 text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setUnit(unit === "kg" ? "lbs" : "kg")}
                    className="px-2 py-1.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-gray-300"
                  >
                    {unit}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 5x5 Squats, Bench PR"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field py-1.5 text-xs mt-1"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-black text-black flex items-center justify-center gap-1.5 transition-all"
              style={{ background: "linear-gradient(90deg, #f472b6, #ec4899)" }}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              {loading ? "Logging..." : myTodayLog ? "Update Gym Log" : "Confirm Gym Check-in (+20 XP)"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
