"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DailyCheckin, User, Goal } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Edit2, ChevronDown, Send, Calendar } from "lucide-react";

interface DailyCheckinProps {
  checkins: DailyCheckin[];
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

function relativeDay(dateStr: string) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" });
}

export function DailyCheckinPanel({ checkins, users, currentUser, activeGoal, onRefresh }: DailyCheckinProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const myTodayCheckin = checkins.find(
    (c) => c.user_id === currentUser.id && c.checkin_date === todayStr
  );
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Past 7 days (excluding today) grouped by date
  const pastCheckins = checkins
    .filter((c) => c.checkin_date !== todayStr)
    .sort((a, b) => b.checkin_date.localeCompare(a.checkin_date));

  // Today's checkins from all users
  const todayAll = checkins
    .filter((c) => c.checkin_date === todayStr)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const getUser = (id: string) => users.find((u) => u.id === id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      await supabase.from("daily_checkins").upsert([{
        user_id: currentUser.id,
        goal_id: activeGoal?.id || null,
        content: text.trim(),
        checkin_date: todayStr,
        updated_at: new Date().toISOString(),
      }], { onConflict: "user_id,checkin_date" });

      await supabase.from("activity_feed").insert([{
        user_id: currentUser.id,
        type: "checkin_added",
        content: `📋 ${currentUser.username} checked in: "${text.trim().slice(0, 60)}${text.length > 60 ? "…" : ""}"`,
      }]);
      setText("");
      onRefresh();
    } finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    if (!editText.trim() || !myTodayCheckin) return;
    setLoading(true);
    try {
      await supabase.from("daily_checkins").update({
        content: editText.trim(),
        updated_at: new Date().toISOString(),
      }).eq("id", myTodayCheckin.id);
      setEditing(false);
      onRefresh();
    } finally { setLoading(false); }
  };

  const hasDoneCheckin = !!myTodayCheckin;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>Daily Check-in</h2>
          <p className="text-xs mt-0.5" style={{ color: "#555" }}>
            {new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        {hasDoneCheckin && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: "#0d1a10", border: "1px solid #22c55e25" }}>
            <CheckCircle className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
            <span className="text-[11px] font-bold" style={{ color: "#22c55e" }}>Done</span>
          </div>
        )}
      </div>

      {/* My check-in card */}
      <div className="card p-4 space-y-3">
        {!hasDoneCheckin ? (
          /* Write form */
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#888" }}>
                What did you do today toward the challenge?
              </p>
              <textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={"• Completed my workout\n• Read 20 pages\n• Skipped junk food 💪"}
                className="input-field w-full"
                style={{ resize: "none" }}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold"
              style={{
                background: text.trim() ? "#f0f0f0" : "#1c1c1c",
                color: text.trim() ? "#0a0a0a" : "#444",
                border: text.trim() ? "none" : "1px solid #252525",
              }}
            >
              <Send className="w-4 h-4" />
              {loading ? "Submitting..." : "Submit Check-in"}
            </motion.button>
          </form>
        ) : editing ? (
          /* Edit form */
          <div className="space-y-3">
            <p className="text-xs font-semibold" style={{ color: "#888" }}>Edit today's check-in</p>
            <textarea
              rows={4}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="input-field w-full"
              style={{ resize: "none" }}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1 text-sm py-2.5">
                Cancel
              </button>
              <button onClick={handleUpdate} disabled={loading}
                className="btn-primary flex-1 text-sm py-2.5">
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          /* Submitted view */
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold" style={{ color: "#888" }}>Your check-in</p>
              <button
                onClick={() => { setEditText(myTodayCheckin.content); setEditing(true); }}
                className="btn-ghost p-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" style={{ color: "#555" }} />
              </button>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#c0c0c0" }}>
              {myTodayCheckin.content}
            </p>
          </div>
        )}
      </div>

      {/* Crew's today check-ins */}
      {todayAll.filter((c) => c.user_id !== currentUser.id).length > 0 && (
        <div className="space-y-2">
          <p className="section-title">Crew today</p>
          {todayAll.filter((c) => c.user_id !== currentUser.id).map((c) => {
            const u = getUser(c.user_id);
            const color = USER_COLORS[u?.username?.toLowerCase() || ""] || "#666";
            return (
              <div key={c.id} className="card p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black"
                    style={{ background: `${color}18`, color }}>
                    {u?.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs font-bold capitalize" style={{ color: "#888" }}>
                    {u?.username}
                  </span>
                  <CheckCircle className="w-3 h-3 ml-auto" style={{ color: "#22c55e" }} />
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap pl-7" style={{ color: "#c0c0c0" }}>
                  {c.content}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Past check-ins toggle */}
      {pastCheckins.length > 0 && (
        <>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-xs font-semibold w-full"
            style={{ color: "#555" }}
          >
            <motion.div animate={{ rotate: showHistory ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
            <Calendar className="w-3.5 h-3.5" />
            Past check-ins ({pastCheckins.length})
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-2"
              >
                {/* Group by date */}
                {Array.from(new Set(pastCheckins.map((c) => c.checkin_date))).map((date) => {
                  const dayCheckins = pastCheckins.filter((c) => c.checkin_date === date);
                  return (
                    <div key={date} className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest px-1"
                        style={{ color: "#444" }}>
                        {relativeDay(date)}
                      </p>
                      {dayCheckins.map((c) => {
                        const u = getUser(c.user_id);
                        const color = USER_COLORS[u?.username?.toLowerCase() || ""] || "#666";
                        return (
                          <div key={c.id} className="card p-3.5 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black"
                                style={{ background: `${color}18`, color }}>
                                {u?.username?.[0]?.toUpperCase()}
                              </div>
                              <span className="text-xs font-bold capitalize" style={{ color: "#888" }}>
                                {u?.username}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed whitespace-pre-wrap pl-7"
                              style={{ color: "#888" }}>
                              {c.content}
                            </p>
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
    </div>
  );
}
