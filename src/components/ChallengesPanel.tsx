"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Challenge, Task, StudyLog, User } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Swords, Plus, Trophy, X, Clock, CheckSquare, Code2 } from "lucide-react";

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  alan:   "#7c5cfc",
  kevin:  "#f5c518",
};

const METRIC_CONFIG = {
  dsa_problems:  { label: "DSA Problems",  icon: Code2,        unit: "problems" },
  study_minutes: { label: "Study Time",    icon: Clock,        unit: "minutes"  },
  tasks_done:    { label: "Tasks Done",    icon: CheckSquare,  unit: "tasks"    },
} as const;

function formatMetricValue(metric: string, val: number) {
  if (metric === "study_minutes") {
    const h = Math.floor(val / 60), m = val % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
  }
  return String(val);
}

interface ChallengesPanelProps {
  challenges:  Challenge[];
  tasks:       Task[];
  studyLogs:   StudyLog[];
  users:       User[];
  currentUser: User;
  onRefresh:   () => void;
}

export function ChallengesPanel({ challenges = [], tasks = [], studyLogs = [], users = [], currentUser, onRefresh }: ChallengesPanelProps) {
  const [showForm,  setShowForm]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [title,     setTitle]     = useState("");
  const [metric,    setMetric]    = useState<Challenge["metric"]>("dsa_problems");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate,   setEndDate]   = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });

  const safeChallenges = challenges || [];
  const safeUsers = users || [];
  const safeStudy = studyLogs || [];

  const active = safeChallenges.filter((c) => c && c.status === "active");
  const past   = safeChallenges.filter((c) => c && c.status !== "active");

  // Compute standings for a challenge
  const getStandings = (c: Challenge) => {
    return safeUsers.map((u) => {
      let score = 0;
      if (c.metric === "dsa_problems") {
        score = safeStudy
          .filter((l) => l && l.user_id === u.id && l.category === "dsa" && l.log_date >= c.start_date && l.log_date <= c.end_date)
          .reduce((s, l) => s + (l.problems_solved || 0), 0);
      } else if (c.metric === "study_minutes") {
        score = safeStudy
          .filter((l) => l && l.user_id === u.id && l.log_date >= c.start_date && l.log_date <= c.end_date)
          .reduce((s, l) => s + (l.duration_minutes || 0), 0);
      } else if (c.metric === "tasks_done") {
        const safeTasks = tasks || [];
        score = safeTasks.filter((t) => t && t.user_id === u.id && t.is_done && t.task_date >= c.start_date && t.task_date <= c.end_date).length;
      }
      return { user: u, score };
    }).sort((a, b) => b.score - a.score);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const { data } = await supabase.from("challenges").insert([{
        title: title.trim(), metric, start_date: startDate, end_date: endDate,
        created_by: currentUser.id, status: "active",
      }]).select().single();
      if (data) {
        await supabase.from("activity_feed").insert([{
          user_id: currentUser.id, type: "goal_created",
          content: `${currentUser.username} started a crew challenge: "${title.trim()}" ⚔️`,
        }]);
      }
      setTitle(""); setShowForm(false); onRefresh();
    } finally { setLoading(false); }
  };

  const handleEnd = async (c: Challenge) => {
    const standings = getStandings(c);
    const winner = standings[0]?.score > 0 ? standings[0].user : null;
    await supabase.from("challenges").update({ status: "ended", winner_id: winner?.id || null }).eq("id", c.id);
    if (winner) {
      await supabase.from("activity_feed").insert([{
        user_id: currentUser.id, type: "goal_completed",
        content: `🏆 "${c.title}" challenge ended — ${winner.username} wins with ${formatMetricValue(c.metric, standings[0].score)} ${METRIC_CONFIG[c.metric].unit}!`,
      }]);
    }
    onRefresh();
  };

  const daysLeft = (endDate: string) => {
    const d = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    return d < 0 ? "Ended" : d === 0 ? "Ends today" : `${d}d left`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4" style={{ color: "#ef4444" }} />
          <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>Challenges</h2>
        </div>
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{
            background: showForm ? "#1c1c1c" : "#ef444418",
            color:      showForm ? "#555"    : "#ef4444",
            border:     `1px solid ${showForm ? "#252525" : "#ef444430"}`,
          }}>
          {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showForm ? "Cancel" : "New challenge"}
        </motion.button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleCreate}
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="card p-4 space-y-3">
              <input required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder='Challenge title — e.g. "Weekend LeetCode Sprint"'
                className="input-field" />

              {/* Metric selector */}
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(METRIC_CONFIG) as Array<Challenge["metric"]>).map((m) => {
                  const cfg = METRIC_CONFIG[m];
                  const Icon = cfg.icon;
                  const active = metric === m;
                  return (
                    <button key={m} type="button" onClick={() => setMetric(m)}
                      className="py-2 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1"
                      style={{
                        background: active ? "#ef444418" : "#1c1c1c",
                        color:      active ? "#ef4444"   : "#555",
                        border:     active ? "1px solid #ef444430" : "1px solid #252525",
                      }}>
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-2">
                {[["Starts", startDate, setStartDate], ["Ends", endDate, setEndDate]].map(([label, val, setter]) => (
                  <div key={label as string}>
                    <p className="text-[10px] font-semibold mb-1" style={{ color: "#555" }}>{label as string}</p>
                    <input type="date" value={val as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                      className="input-field" style={{ padding: "8px 12px" }} />
                  </div>
                ))}
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full text-sm"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
                {loading ? "Creating…" : "⚔️ Start Challenge"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Active challenges */}
      {active.length === 0 && !showForm && (
        <div className="card p-6 text-center space-y-2">
          <Swords className="w-7 h-7 mx-auto" style={{ color: "#333" }} />
          <p className="text-sm font-bold" style={{ color: "#444" }}>No active challenges</p>
          <p className="text-xs" style={{ color: "#333" }}>Start a head-to-head with your crew</p>
        </div>
      )}

      {active.map((c) => {
        const standings = getStandings(c);
        const maxScore  = standings[0]?.score || 1;
        const cfg       = METRIC_CONFIG[c.metric];
        const Icon      = cfg.icon;
        const medals    = ["🥇", "🥈", "🥉"];
        const isCreator = c.created_by === currentUser.id;

        return (
          <div key={c.id} className="card p-4 space-y-3"
            style={{ border: "1px solid #ef444420", background: "linear-gradient(135deg, #1a0d0d, #161616)" }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-black text-sm" style={{ color: "#f0f0f0" }}>{c.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: "#ef4444" }}>
                    <Icon className="w-3 h-3" /> {cfg.label}
                  </div>
                  <span className="text-[10px]" style={{ color: "#444" }}>·</span>
                  <span className="text-[10px]" style={{ color: "#555" }}>{daysLeft(c.end_date)}</span>
                </div>
              </div>
              {isCreator && (
                <button onClick={() => handleEnd(c)}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-xl shrink-0"
                  style={{ background: "#1c1c1c", color: "#555", border: "1px solid #252525" }}>
                  End
                </button>
              )}
            </div>

            {/* Standings */}
            <div className="space-y-2">
              {standings.map(({ user: u, score }, i) => {
                const c2 = USER_COLORS[u.username.toLowerCase()] || "#666";
                return (
                  <div key={u.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 13 }}>{medals[i] || `#${i + 1}`}</span>
                      <span className="text-xs font-bold capitalize flex-1" style={{ color: c2 }}>{u.username}</span>
                      <span className="text-xs font-black tabular-nums" style={{ color: score > 0 ? c2 : "#333" }}>
                        {formatMetricValue(c.metric, score)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1c1c1c" }}>
                      <motion.div initial={{ width: 0 }}
                        animate={{ width: `${maxScore > 0 ? (score / maxScore) * 100 : 0}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full" style={{ background: c2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Past challenges */}
      {past.length > 0 && (
        <details className="space-y-2">
          <summary className="text-xs font-bold cursor-pointer" style={{ color: "#444" }}>
            Past challenges ({past.length})
          </summary>
          <div className="space-y-2 mt-2">
            {past.map((c) => {
              const winner = users.find((u) => u.id === c.winner_id);
              const wc = winner ? USER_COLORS[winner.username.toLowerCase()] || "#666" : "#555";
              return (
                <div key={c.id} className="card p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold" style={{ color: "#d0d0d0" }}>{c.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#444" }}>
                      {new Date(c.start_date + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" })} →{" "}
                      {new Date(c.end_date   + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  {winner ? (
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-3 h-3" style={{ color: wc }} />
                      <span className="text-xs font-bold capitalize" style={{ color: wc }}>{winner.username}</span>
                    </div>
                  ) : (
                    <span className="text-[10px]" style={{ color: "#444" }}>No winner</span>
                  )}
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
