"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StudyLog, User } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import {
  GraduationCap,
  Plus, X, Eye, EyeOff, Flame, Trophy,
} from "lucide-react";


// ── constants ──────────────────────────────────────────────────────────────

const DSA_PLATFORMS = [
  "LeetCode", "Codeforces", "GeeksForGeeks",
  "HackerRank", "CodeChef", "AtCoder", "Other",
];

const DSA_TOPICS = [
  "Arrays", "Strings", "Linked Lists", "Stacks & Queues",
  "Trees", "Graphs", "Dynamic Programming", "Recursion",
  "Binary Search", "Sorting", "Hashing", "Heaps",
  "Tries", "Backtracking", "Greedy", "Math",
  "Bit Manipulation", "Two Pointers", "Sliding Window", "Other",
];

const DSA_SUBTOPICS = [
  "Two Pointers", "Sliding Window", "DFS", "BFS", "Memoization",
  "Tabulation", "Binary Search", "Prefix Sum", "Monotonic Stack",
  "Union Find", "Topological Sort", "Dijkstra", "Other",
];

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  pruthvi: "#7c5cfc",
  kevin:  "#f5c518",
};

const DIFF_COLORS = { easy: "#22c55e", medium: "#f59e0b", hard: "#ef4444" };

const CATEGORY_CONFIG = {
  dsa:     { label: "DSA",     emoji: "💻", color: "#7c5cfc" },
  college: { label: "College", emoji: "📚", color: "#f59e0b" },
  general: { label: "General", emoji: "🧠", color: "#22c55e" },
} as const;

type Category = "dsa" | "college" | "general";

// ── helpers ────────────────────────────────────────────────────────────────

function formatDuration(mins: number) {
  if (!mins) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function relativeTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" });
}

// ── component ──────────────────────────────────────────────────────────────

interface StudyTrackerProps {
  logs:        StudyLog[];
  users:       User[];
  currentUser: User;
  onRefresh:   () => void;
}

export function StudyTracker({ logs, users, currentUser, onRefresh }: StudyTrackerProps) {
  const [category,      setCategory]      = useState<Category>("dsa");
  const [showForm,      setShowForm]      = useState(false);
  const [dismissed,     setDismissed]     = useState<Set<string>>(new Set());
  const [lbPeriod,      setLbPeriod]      = useState<"week" | "month">("week");

  // form fields
  const [subject,       setSubject]       = useState("");
  const [topic,         setTopic]         = useState("");
  const [customTopic,   setCustomTopic]   = useState("");
  const [problems,      setProblems]      = useState("");
  const [duration,      setDuration]      = useState("");
  const [difficulty,    setDifficulty]    = useState<"easy" | "medium" | "hard">("medium");
  const [platform,      setPlatform]      = useState("LeetCode");
  const [customPlatform,setCustomPlatform]= useState("");
  const [notes,         setNotes]         = useState("");
  const [isPrivate,     setIsPrivate]     = useState(false);
  const [loading,       setLoading]       = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const userColor = USER_COLORS[currentUser.username.toLowerCase()] || "#888";
  const catCfg = CATEGORY_CONFIG[category];

  // ── derived data ─────────────────────────────────────────────────────────

  const todayLogs = useMemo(() => logs.filter((l) => l.log_date === todayStr), [logs, todayStr]);

  const myTodayProblems = useMemo(
    () => todayLogs.filter((l) => l.user_id === currentUser.id && l.category === "dsa")
            .reduce((s, l) => s + l.problems_solved, 0),
    [todayLogs, currentUser.id],
  );
  const myTodayMinutes = useMemo(
    () => todayLogs.filter((l) => l.user_id === currentUser.id)
            .reduce((s, l) => s + l.duration_minutes, 0),
    [todayLogs, currentUser.id],
  );

  // visible = own + others' public
  const visibleLogs = useMemo(
    () => logs
      .filter((l) => !dismissed.has(l.id) && (!l.is_private || l.user_id === currentUser.id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [logs, dismissed, currentUser.id],
  );

  // crew DSA comparison (public only)
  const crewToday = useMemo(() => {
    return users.map((u) => {
      const uLogs = todayLogs.filter((l) => l.user_id === u.id && (!l.is_private || u.id === currentUser.id));
      return {
        user: u,
        problems: uLogs.filter((l) => l.category === "dsa").reduce((s, l) => s + l.problems_solved, 0),
        minutes:  uLogs.reduce((s, l) => s + l.duration_minutes, 0),
      };
    }).filter((x) => x.problems > 0 || x.minutes > 0);
  }, [todayLogs, users, currentUser.id]);

  const maxProblems = Math.max(...crewToday.map((x) => x.problems), 1);

  // subject breakdown (last 14 days, current category, own logs)
  const subjectBreakdown = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14);
    const recent = logs.filter(
      (l) => l.user_id === currentUser.id && l.category === category && new Date(l.log_date) >= cutoff,
    );
    const map: Record<string, { sessions: number; problems: number; minutes: number }> = {};
    for (const l of recent) {
      if (!map[l.subject]) map[l.subject] = { sessions: 0, problems: 0, minutes: 0 };
      map[l.subject].sessions++;
      map[l.subject].problems += l.problems_solved;
      map[l.subject].minutes  += l.duration_minutes;
    }
    return Object.entries(map)
      .map(([s, v]) => ({ subject: s, ...v }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 6);
  }, [logs, currentUser.id, category]);

  const maxSessions = Math.max(...subjectBreakdown.map((s) => s.sessions), 1);

  // ── DSA leaderboard (weekly / monthly) ────────────────────────────────────
  const leaderboard = useMemo(() => {
    const now = new Date();
    let cutoff: Date;
    if (lbPeriod === "week") {
      // Start of current Monday
      cutoff = new Date(now);
      const day = cutoff.getDay(); // 0=Sun
      const diff = day === 0 ? -6 : 1 - day;
      cutoff.setDate(cutoff.getDate() + diff);
      cutoff.setHours(0, 0, 0, 0);
    } else {
      // Start of current month
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const cutoffStr = cutoff.toISOString().split("T")[0];

    return users.map((u) => {
      const uLogs = logs.filter(
        (l) => l.user_id === u.id && l.category === "dsa" &&
               l.log_date >= cutoffStr && (!l.is_private || u.id === currentUser.id)
      );
      return {
        user:     u,
        problems: uLogs.reduce((s, l) => s + l.problems_solved, 0),
        minutes:  uLogs.reduce((s, l) => s + l.duration_minutes, 0),
        sessions: uLogs.length,
      };
    }).sort((a, b) => b.problems - a.problems);
  }, [logs, users, lbPeriod, currentUser.id]);

  const catLogs = useMemo(
    () => visibleLogs.filter((l) => l.category === category).slice(0, 12),
    [visibleLogs, category],
  );

  // study streak — consecutive days with at least one log (any category)
  const studyStreak = useMemo(() => {
    const myDates = [...new Set(
      logs.filter((l) => l.user_id === currentUser.id).map((l) => l.log_date)
    )].sort().reverse();
    let streak = 0;
    const expected = new Date();
    expected.setHours(0, 0, 0, 0);
    for (const dateStr of myDates) {
      const d = new Date(dateStr + "T00:00:00");
      const expStr = expected.toISOString().split("T")[0];
      if (dateStr === expStr) {
        streak++;
        expected.setDate(expected.getDate() - 1);
      } else if (d < expected) {
        break; // gap found
      }
    }
    return streak;
  }, [logs, currentUser.id]);

  // ── handlers ─────────────────────────────────────────────────────────────

  const resetForm = () => {
    setSubject(""); setTopic(""); setCustomTopic(""); setProblems("");
    setDuration(""); setDifficulty("medium"); setPlatform("LeetCode");
    setCustomPlatform(""); setNotes(""); setIsPrivate(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    setLoading(true);
    try {
      const effectivePlatform = platform === "Other" ? (customPlatform.trim() || "Other") : platform;
      const effectiveTopic    = topic === "Other"    ? (customTopic.trim()    || null)   : (topic || null);

      await supabase.from("study_logs").insert([{
        user_id:          currentUser.id,
        category,
        subject:          subject.trim(),
        topic:            effectiveTopic,
        problems_solved:  category === "dsa" ? (parseInt(problems) || 0) : 0,
        duration_minutes: parseInt(duration) || 0,
        difficulty:       category === "dsa" ? difficulty : null,
        platform:         category === "dsa" ? effectivePlatform : null,
        notes:            notes.trim() || null,
        is_private:       isPrivate,
        log_date:         todayStr,
      }]);

      if (!isPrivate) {
        let content = "";
        const p = parseInt(problems) || 0;
        const dur = formatDuration(parseInt(duration) || 0);
        if (category === "dsa") {
          content = `${currentUser.username} solved ${p} ${effectivePlatform} problem${p !== 1 ? "s" : ""} on ${subject.trim()}${effectiveTopic ? ` · ${effectiveTopic}` : ""} 💻`;
        } else if (category === "college") {
          content = `${currentUser.username} studied ${subject.trim()}${effectiveTopic ? ` — ${effectiveTopic}` : ""} for ${dur} 📚`;
        } else {
          content = `${currentUser.username} studied ${subject.trim()} for ${dur} 🧠`;
        }
        await supabase.from("activity_feed").insert([{
          user_id: currentUser.id, type: "study_logged", content,
        }]);
        // Push notify crew
        try {
          await fetch("/api/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Countdown Crew 📚",
              body: content,
              url: "/",
              excludeUserId: currentUser.id,
            }),
          });
        } catch { /* non-critical */ }
      }

      resetForm(); setShowForm(false); onRefresh();
    } finally { setLoading(false); }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4" style={{ color: "#555" }} />
          <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>Study</h2>
        </div>
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={() => { setShowForm((v) => !v); if (showForm) resetForm(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{
            background: showForm ? "#1c1c1c" : `${userColor}18`,
            color:      showForm ? "#555"    : userColor,
            border:     `1px solid ${showForm ? "#252525" : userColor + "30"}`,
          }}>
          {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showForm ? "Cancel" : "Log session"}
        </motion.button>
      </div>

      {/* ── Today quick stats ── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3.5">
          <p className="text-[10px] font-bold tracking-widest" style={{ color: "#444" }}>PROBLEMS</p>
          <p className="text-xl font-black tabular-nums mt-0.5" style={{ color: "#7c5cfc" }}>
            {myTodayProblems}
          </p>
        </div>
        <div className="card p-3.5">
          <p className="text-[10px] font-bold tracking-widest" style={{ color: "#444" }}>STUDY TIME</p>
          <p className="text-xl font-black tabular-nums mt-0.5" style={{ color: "#22c55e" }}>
            {myTodayMinutes > 0 ? formatDuration(myTodayMinutes) : "—"}
          </p>
        </div>
        <div className="card p-3.5">
          <p className="text-[10px] font-bold tracking-widest" style={{ color: "#444" }}>STREAK</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Flame className="w-3.5 h-3.5" style={{ color: studyStreak > 0 ? "#f59e0b" : "#333" }} />
            <p className="text-xl font-black tabular-nums" style={{ color: studyStreak > 0 ? "#f59e0b" : "#444" }}>
              {studyStreak}
            </p>
          </div>
        </div>
      </div>

      {/* ── Crew DSA comparison ── */}
      {crewToday.length > 1 && (
        <div className="card p-3.5 space-y-2.5">
          <p className="text-[10px] font-bold tracking-widest" style={{ color: "#444" }}>CREW · DSA TODAY</p>
          {crewToday.sort((a, b) => b.problems - a.problems).map(({ user: u, problems: p }) => {
            const c = USER_COLORS[u.username.toLowerCase()] || "#666";
            return (
              <div key={u.id} className="flex items-center gap-2">
                <span className="text-xs font-bold capitalize w-14 shrink-0" style={{ color: c }}>{u.username}</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: "#1c1c1c" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(p / maxProblems) * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full" style={{ background: c }}
                  />
                </div>
                <span className="text-[10px] font-bold w-8 text-right tabular-nums" style={{ color: "#555" }}>
                  {p}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DSA Leaderboard ── */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5" style={{ color: "#f5c518" }} />
            <p className="text-[10px] font-bold tracking-widest" style={{ color: "#444" }}>DSA LEADERBOARD</p>
          </div>
          <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: "#111" }}>
            {(["week", "month"] as const).map((p) => (
              <button key={p} onClick={() => setLbPeriod(p)}
                className="px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition-all"
                style={{
                  background: lbPeriod === p ? "#1c1c1c" : "transparent",
                  color:      lbPeriod === p ? "#f0f0f0" : "#555",
                }}>
                {p === "week" ? "This week" : "This month"}
              </button>
            ))}
          </div>
        </div>

        {leaderboard.every((r) => r.problems === 0) ? (
          <p className="text-xs text-center py-2" style={{ color: "#444" }}>
            No DSA logs {lbPeriod === "week" ? "this week" : "this month"} yet.
          </p>
        ) : (
          leaderboard.map(({ user: u, problems: p, minutes: m }, i) => {
            const c = USER_COLORS[u.username.toLowerCase()] || "#666";
            const medals = ["🥇", "🥈", "🥉"];
            const maxP = leaderboard[0].problems || 1;
            return (
              <div key={u.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 14, lineHeight: 1 }}>{medals[i] || `#${i+1}`}</span>
                  <span className="text-xs font-bold capitalize flex-1" style={{ color: c }}>{u.username}</span>
                  <span className="text-xs font-black tabular-nums" style={{ color: p > 0 ? c : "#333" }}>
                    {p} <span style={{ color: "#444", fontWeight: 400 }}>prob{p !== 1 ? "s" : ""}</span>
                  </span>
                  {m > 0 && (
                    <span className="text-[10px] tabular-nums" style={{ color: "#444" }}>{formatDuration(m)}</span>
                  )}
                </div>
                {p > 0 && (
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "#1c1c1c" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p / maxP) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-full rounded-full" style={{ background: c }}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Category tabs ── */}
      <div className="flex gap-2">
        {(["dsa", "college", "general"] as Category[]).map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const active = category === cat;
          return (
            <button key={cat} onClick={() => setCategory(cat)}
              className="flex-1 py-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: active ? `${cfg.color}18` : "#161616",
                color:      active ? cfg.color         : "#444",
                border:     active ? `1px solid ${cfg.color}35` : "1px solid #1e1e1e",
              }}>
              <span>{cfg.emoji}</span>
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* ── Log form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            key="study-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSave}
            className="card p-4 space-y-3 overflow-hidden"
          >
            {/* Subject */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>
                {category === "dsa" ? "DSA Topic" : "Subject"}
              </label>
              {category === "dsa" ? (
                <select value={subject} onChange={(e) => setSubject(e.target.value)} required
                  className="input-field mt-1.5 text-sm">
                  <option value="">Select topic…</option>
                  {DSA_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <input value={subject} onChange={(e) => setSubject(e.target.value)} required
                  placeholder={category === "college" ? "e.g. DBMS, Algorithms, Physics…" : "e.g. Machine Learning, System Design…"}
                  className="input-field mt-1.5 text-sm" />
              )}
            </div>

            {/* Sub-topic */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>
                Sub-topic / Chapter <span style={{ color: "#444", fontWeight: 400 }}>(optional)</span>
              </label>
              {category === "dsa" ? (
                <>
                  <select value={topic} onChange={(e) => setTopic(e.target.value)}
                    className="input-field mt-1.5 text-sm">
                    <option value="">—</option>
                    {DSA_SUBTOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {topic === "Other" && (
                    <input value={customTopic} onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="Custom sub-topic" className="input-field mt-1.5 text-sm" />
                  )}
                </>
              ) : (
                <input value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="Chapter, unit, or concept…"
                  className="input-field mt-1.5 text-sm" />
              )}
            </div>

            {/* DSA-specific fields */}
            {category === "dsa" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>Problems solved</label>
                    <input type="number" min="0" max="300" value={problems}
                      onChange={(e) => setProblems(e.target.value)}
                      placeholder="0" className="input-field mt-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>Duration (mins)</label>
                    <input type="number" min="0" max="720" value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="60" className="input-field mt-1.5 text-sm" />
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>Difficulty</label>
                  <div className="flex gap-2 mt-1.5">
                    {(["easy", "medium", "hard"] as const).map((d) => (
                      <button type="button" key={d} onClick={() => setDifficulty(d)}
                        className="flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition-all"
                        style={{
                          background: difficulty === d ? `${DIFF_COLORS[d]}20` : "#1c1c1c",
                          color:      difficulty === d ? DIFF_COLORS[d] : "#444",
                          border:     difficulty === d ? `1px solid ${DIFF_COLORS[d]}40` : "1px solid #252525",
                        }}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>Platform</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                    className="input-field mt-1.5 text-sm">
                    {DSA_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {platform === "Other" && (
                    <input value={customPlatform} onChange={(e) => setCustomPlatform(e.target.value)}
                      placeholder="Platform name…" className="input-field mt-1.5 text-sm" />
                  )}
                </div>
              </>
            )}

            {/* Duration for college / general */}
            {category !== "dsa" && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>Duration (mins)</label>
                <input type="number" min="0" max="720" value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="60" className="input-field mt-1.5 text-sm" />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>
                Notes <span style={{ color: "#444", fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you learn, struggle with, or want to revisit?"
                rows={2} className="input-field mt-1.5 text-sm resize-none" />
            </div>

            {/* Privacy toggle */}
            <button type="button" onClick={() => setIsPrivate((v) => !v)}
              className="flex items-center gap-2 text-xs font-semibold py-1"
              style={{ color: isPrivate ? "#f59e0b" : "#555" }}>
              {isPrivate
                ? <EyeOff className="w-3.5 h-3.5" />
                : <Eye className="w-3.5 h-3.5" />}
              {isPrivate ? "Private — only you can see this" : "Public — crew can see this"}
            </button>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-opacity"
              style={{ background: catCfg.color, color: "#0a0a0a", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Saving…" : `Log ${catCfg.label} Session`}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Subject breakdown ── */}
      {subjectBreakdown.length > 0 && (
        <div className="card p-4 space-y-3">
          <p className="text-[10px] font-bold tracking-widest" style={{ color: "#444" }}>
            YOUR {catCfg.label.toUpperCase()} · LAST 14 DAYS
          </p>
          {subjectBreakdown.map(({ subject: s, sessions, problems: p, minutes: m }) => (
            <div key={s} className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold" style={{ color: "#d0d0d0" }}>{s}</span>
                <span className="text-[10px]" style={{ color: "#555" }}>
                  {category === "dsa" ? `${p} problems` : formatDuration(m)}
                  {" · "}
                  {sessions} session{sessions !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "#1c1c1c" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(sessions / maxSessions) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: catCfg.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Recent logs ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-widest" style={{ color: "#444" }}>RECENT LOGS</p>
          {catLogs.length > 0 && (
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, ...catLogs.map((l) => l.id)]))}
              className="text-[10px] font-semibold" style={{ color: "#444" }}>
              Clear all
            </button>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {catLogs.map((log) => {
            const u    = users.find((u) => u.id === log.user_id);
            const c    = USER_COLORS[u?.username?.toLowerCase() || ""] || "#666";
            const cfg  = CATEGORY_CONFIG[log.category];
            const diff = log.difficulty as keyof typeof DIFF_COLORS | null;
            return (
              <motion.div key={log.id} layout
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="card p-3.5 group"
                style={{ borderColor: `${c}18` }}>
                <div className="flex items-start gap-2.5">
                  {/* Category emoji badge */}
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-sm"
                    style={{ background: `${cfg.color}15` }}>
                    {cfg.emoji}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold" style={{ color: "#d0d0d0" }}>{log.subject}</span>
                      {log.topic && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                          style={{ background: "#1c1c1c", color: "#666" }}>
                          {log.topic}
                        </span>
                      )}
                      {log.is_private && <EyeOff className="w-2.5 h-2.5" style={{ color: "#f59e0b" }} />}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-bold capitalize" style={{ color: c }}>{u?.username}</span>
                      {log.problems_solved > 0 && (
                        <span className="text-[10px]" style={{ color: "#555" }}>
                          {log.problems_solved} problem{log.problems_solved !== 1 ? "s" : ""}
                        </span>
                      )}
                      {log.duration_minutes > 0 && (
                        <span className="text-[10px]" style={{ color: "#555" }}>
                          {formatDuration(log.duration_minutes)}
                        </span>
                      )}
                      {diff && (
                        <span className="text-[10px] font-bold capitalize"
                          style={{ color: DIFF_COLORS[diff] }}>
                          {diff}
                        </span>
                      )}
                      {log.platform && (
                        <span className="text-[10px] px-1.5 py-px rounded-md"
                          style={{ background: "#1c1c1c", color: "#555" }}>
                          {log.platform}
                        </span>
                      )}
                    </div>

                    {log.notes && (
                      <p className="text-[11px] mt-1 leading-snug" style={{ color: "#555" }}>{log.notes}</p>
                    )}
                  </div>

                  {/* Time + dismiss */}
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <span className="text-[10px]" style={{ color: "#3a3a3a" }}>{relativeTime(log.created_at)}</span>
                    <motion.button whileTap={{ scale: 0.85 }}
                      onClick={() => setDismissed((prev) => new Set([...prev, log.id]))}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-lg flex items-center justify-center"
                      style={{ background: "#252525", color: "#555" }}>
                      <X className="w-3 h-3" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {catLogs.length === 0 && (
          <div className="card p-8 text-center">
            <span className="text-3xl">{catCfg.emoji}</span>
            <p className="text-sm mt-2" style={{ color: "#444" }}>
              No {catCfg.label} logs yet. Hit &ldquo;Log session&rdquo; to start!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
