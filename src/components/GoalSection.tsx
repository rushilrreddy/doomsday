"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Goal, User, Task } from "@/lib/types";
import { CountdownClock } from "./CountdownClock";
import { Plus, ChevronDown, Trophy, Check, X, Edit2, MoreHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface GoalSectionProps {
  goals: Goal[];
  tasks: Task[];
  currentUser: User;
  onRefresh: () => void;
}

// ── Circular progress ring ──────────────────────────────────────────────────────
function Ring({ pct, color, size = 88, stroke = 7, label, value }: {
  pct: number; color: string; size?: number; stroke?: number;
  label: string; value: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1c1c1c" strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        {/* centre text — rotated back */}
        <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
          style={{ transform: "rotate(90deg)", transformOrigin: `${size/2}px ${size/2}px`,
            fill: color, fontSize: 13, fontWeight: 800, fontFamily: "inherit" }}>
          {value}
        </text>
      </svg>
      <span style={{ fontSize: 9, color: "#555", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function toLocalDatetimeInput(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Sheet = "none" | "create" | "edit" | "options";

interface DateFieldProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}
function DateField({ label, hint, value, onChange, required }: DateFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold" style={{ color: "#666" }}>{label}</p>
        {hint && <p className="text-[10px]" style={{ color: "#444" }}>{hint}</p>}
      </div>
      <input
        type="datetime-local"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      />
    </div>
  );
}

export function GoalSection({ goals, tasks, currentUser, onRefresh }: GoalSectionProps) {
  const [sheet, setSheet] = useState<Sheet>("none");
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [proofGoalId, setProofGoalId] = useState<string | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  // Create fields
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [startDate, setStartDate] = useState("");
  const [date, setDate] = useState("");
  const [stake, setStake] = useState("");

  // Edit fields
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStake, setEditStake] = useState("");

  const active = goals.find((g) => g.status === "active");
  const past = goals.filter((g) => g.status !== "active");

  const openCreate = () => {
    // Default start = now, end = 30 days from now
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 86400000);
    setStartDate(toLocalDatetimeInput(now.toISOString()));
    setDate(toLocalDatetimeInput(end.toISOString()));
    setTitle(""); setDesc(""); setStake("");
    setSheet("create");
  };

  const openEdit = () => {
    if (!active) return;
    setEditTitle(active.title);
    setEditDesc(active.description || "");
    setEditStartDate(active.start_date ? toLocalDatetimeInput(active.start_date) : "");
    setEditDate(toLocalDatetimeInput(active.target_date));
    setEditStake(active.stake);
    setSheet("edit");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (active) await supabase.from("goals").update({ status: "failed" }).eq("id", active.id);
      await supabase.from("goals").insert([{
        title,
        description: desc || null,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        target_date: new Date(date).toISOString(),
        stake,
        status: "active",
        created_by: currentUser.id,
      }]);
      await supabase.from("activity_feed").insert([{
        user_id: currentUser.id, type: "goal_created",
        content: `${currentUser.username} launched a new challenge: "${title}" 🎯`,
      }]);
      setSheet("none");
      onRefresh();
    } finally { setLoading(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    setLoading(true);
    try {
      await supabase.from("goals").update({
        title: editTitle,
        description: editDesc || null,
        start_date: editStartDate ? new Date(editStartDate).toISOString() : null,
        target_date: new Date(editDate).toISOString(),
        stake: editStake,
      }).eq("id", active.id);
      await supabase.from("activity_feed").insert([{
        user_id: currentUser.id, type: "goal_created",
        content: `${currentUser.username} updated the challenge details ✏️`,
      }]);
      setSheet("none");
      onRefresh();
    } finally { setLoading(false); }
  };

  const handleStatus = async (id: string, status: "achieved" | "failed") => {
    if (status === "achieved") {
      // open proof modal first
      setProofGoalId(id); setProofNote(""); setProofFile(null); setProofPreview(null);
      return;
    }
    await supabase.from("goals").update({ status: "failed", winner_id: null }).eq("id", id);
    await supabase.from("activity_feed").insert([{
      user_id: currentUser.id, type: "goal_completed",
      content: `Challenge marked FAILED! 💀`,
    }]);
    setSheet("none"); onRefresh();
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofGoalId) return;
    setProofLoading(true);
    try {
      let proofUrl: string | null = null;
      if (proofFile) {
        const ext  = proofFile.name.split(".").pop();
        const path = `${proofGoalId}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("goal-proofs").upload(path, proofFile, { upsert: true });
        if (!error) {
          const { data: urlData } = supabase.storage.from("goal-proofs").getPublicUrl(path);
          proofUrl = urlData.publicUrl;
        }
      }
      await supabase.from("goals").update({
        status: "achieved",
        winner_id: currentUser.id,
        proof_url:  proofUrl,
        proof_note: proofNote.trim() || null,
      }).eq("id", proofGoalId);
      await supabase.from("activity_feed").insert([{
        user_id: currentUser.id, type: "goal_completed",
        content: `🏆 ${currentUser.username} marked the challenge ACHIEVED! ${proofNote.trim() ? `"${proofNote.trim()}"` : ""}`,
      }]);
      setProofGoalId(null); setSheet("none"); onRefresh();
    } finally { setProofLoading(false); }
  };

  const close = () => setSheet("none");

  /* ─── Shared form fields renderer ─── */
  const renderForm = (
    isEdit: boolean,
    fields: {
      title: string; setTitle: (v: string) => void;
      desc: string; setDesc: (v: string) => void;
      startDate: string; setStartDate: (v: string) => void;
      date: string; setDate: (v: string) => void;
      stake: string; setStake: (v: string) => void;
    },
    onSubmit: (e: React.FormEvent) => void,
  ) => (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold mb-1.5" style={{ color: "#666" }}>Title</p>
        <input required value={fields.title} onChange={(e) => fields.setTitle(e.target.value)}
          placeholder="Challenge title" className="input-field" />
      </div>
      <div>
        <p className="text-[11px] font-semibold mb-1.5" style={{ color: "#666" }}>Rules / Description</p>
        <textarea rows={2} value={fields.desc} onChange={(e) => fields.setDesc(e.target.value)}
          placeholder="Rules or description (optional)"
          className="input-field" style={{ resize: "none" }} />
      </div>

      {/* Date range row */}
      <div className="grid grid-cols-2 gap-2.5">
        <DateField
          label="Starts"
          hint="Optional"
          value={fields.startDate}
          onChange={fields.setStartDate}
        />
        <DateField
          label="Deadline"
          value={fields.date}
          onChange={fields.setDate}
          required
        />
      </div>

      <div>
        <p className="text-[11px] font-semibold mb-1.5" style={{ color: "#666" }}>The Bet / Stake</p>
        <input required value={fields.stake} onChange={(e) => fields.setStake(e.target.value)}
          placeholder="e.g. Loser buys dinner 🍕" className="input-field" />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button"
          onClick={() => isEdit ? setSheet("options") : close()}
          className="btn-secondary flex-1 text-sm">
          {isEdit ? "← Back" : "Cancel"}
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 text-sm">
          {loading ? "Saving..." : isEdit ? "Save Changes ✓" : "Launch 🚀"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-3">
      {active ? (
        <>
          {/* Goal progress rings */}
          {(() => {
            const now = Date.now();
            const start = active.start_date ? new Date(active.start_date).getTime() : new Date(active.created_at).getTime();
            const end   = new Date(active.target_date).getTime();
            const timePct = Math.min(Math.round(((now - start) / (end - start)) * 100), 100);

            const goalTasks = (tasks || []).filter((t) => {
              if (!t || !t.task_date) return false;
              const td = new Date(t.task_date);
              return td >= new Date(start) && td <= new Date(end);
            });
            const doneTasks  = goalTasks.filter((t) => t.is_done).length;
            const taskPct    = goalTasks.length > 0 ? Math.round((doneTasks / goalTasks.length) * 100) : 0;
            const timeLeft   = Math.max(0, Math.round((end - now) / 86400000));

            return (
              <div className="card p-4">
                <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: "#444" }}>GOAL PROGRESS</p>
                <div className="flex items-center justify-around">
                  <Ring pct={timePct}  color="#ef4444" label="Time used"  value={`${timePct}%`}  />
                  <div className="flex flex-col items-center gap-0.5">
                    <p className="text-2xl font-black tabular-nums" style={{ color: "#f0f0f0" }}>{timeLeft}</p>
                    <p className="text-[10px]" style={{ color: "#555" }}>days left</p>
                  </div>
                  <Ring pct={taskPct} color="#22c55e" label="Tasks done" value={`${taskPct}%`} />
                </div>
              </div>
            );
          })()}

          <CountdownClock
            targetDate={active.target_date}
            startDate={active.start_date}
            title={active.title}
            stake={active.stake}
            status={active.status}
            onMarkAchieved={() => handleStatus(active.id, "achieved")}
            onEdit={openEdit}
            onMarkFailed={() => handleStatus(active.id, "failed")}
            onNewChallenge={openCreate}
          />
        </>
      ) : (
        <div className="card p-7 text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "#1c1c1c" }}>
            <Trophy className="w-5 h-5" style={{ color: "#555" }} />
          </div>
          <p className="font-bold text-sm" style={{ color: "#f0f0f0" }}>No active challenge</p>
          <p className="text-xs" style={{ color: "#555" }}>Start a new bet with your crew</p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={openCreate}
            className="btn-primary mx-auto flex items-center gap-2 text-xs px-5 py-2.5">
            <Plus className="w-4 h-4" /> New Challenge
          </motion.button>
        </div>
      )}

      {/* History toggle */}
      <button onClick={() => setShowHistory(!showHistory)}
        className="flex items-center gap-2 text-xs font-semibold w-full py-0.5"
        style={{ color: "#555" }}>
        <motion.div animate={{ rotate: showHistory ? 180 : 0 }}>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
        Past challenges ({past.length})
        {active && (
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={(e) => { e.stopPropagation(); openCreate(); }}
            className="ml-auto flex items-center gap-1 text-xs font-bold"
            style={{ color: "#f0f0f0" }}>
            <Plus className="w-3.5 h-3.5" /> New
          </motion.button>
        )}
      </button>

      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
            {past.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: "#444" }}>No past challenges yet.</p>
            ) : past.map((g) => (
              <div key={g.id} className="card p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "#f0f0f0" }}>{g.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#555" }}>
                      {g.start_date
                        ? `${new Date(g.start_date).toLocaleDateString("en", { month: "short", day: "numeric" })} → `
                        : ""}
                      {new Date(g.target_date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span style={{
                    background: g.status === "achieved" ? "#0d1a10" : "#1a0d0d",
                    color: g.status === "achieved" ? "#22c55e" : "#ef4444",
                    border: `1px solid ${g.status === "achieved" ? "#22c55e20" : "#ef444420"}`,
                    padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
                  }}>
                    {g.status}
                  </span>
                </div>
                {(g.proof_note || g.proof_url) && (
                  <div className="pt-2 border-t border-[#202020] space-y-2">
                    {g.proof_note && (
                      <p className="text-xs italic" style={{ color: "#aaa" }}>
                        &ldquo;{g.proof_note}&rdquo;
                      </p>
                    )}
                    {g.proof_url && (
                      <div className="relative rounded-xl overflow-hidden max-h-48 border border-[#2a2a2a]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={g.proof_url} alt="Challenge proof" className="w-full h-auto object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM SHEETS ── */}
      <AnimatePresence>
        {sheet !== "none" && (
          <div className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.72)" }} onClick={close}>

            {/* Options */}
            {sheet === "options" && (
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-t-3xl p-5 space-y-2"
                style={{ background: "#161616", border: "1px solid #252525", borderBottom: "none",
                  paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
                <div className="w-8 h-1 rounded-full mx-auto mb-3" style={{ background: "#2a2a2a" }} />

                <button onClick={openEdit}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
                  style={{ background: "#1c1c1c", border: "1px solid #252525" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#252525" }}>
                    <Edit2 className="w-3.5 h-3.5" style={{ color: "#f0f0f0" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#f0f0f0" }}>Edit Challenge</p>
                    <p className="text-xs" style={{ color: "#555" }}>Change title, dates, stake or rules</p>
                  </div>
                </button>

                <button onClick={() => { close(); openCreate(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
                  style={{ background: "#1c1c1c", border: "1px solid #252525" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#252525" }}>
                    <Plus className="w-3.5 h-3.5" style={{ color: "#f0f0f0" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#f0f0f0" }}>New Challenge</p>
                    <p className="text-xs" style={{ color: "#555" }}>Replace current with a fresh one</p>
                  </div>
                </button>

                <div style={{ borderTop: "1px solid #1a1a1a", marginTop: 8, paddingTop: 8 }} className="space-y-2">
                  <button onClick={() => active && handleStatus(active.id, "achieved")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
                    style={{ background: "#0d1a10", border: "1px solid #22c55e18" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#11311a" }}>
                      <Check className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#22c55e" }}>Mark Achieved</p>
                      <p className="text-xs" style={{ color: "#1a5c2a" }}>Complete as a win 🏆</p>
                    </div>
                  </button>

                  <button onClick={() => active && handleStatus(active.id, "failed")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
                    style={{ background: "#1a0d0d", border: "1px solid #ef444418" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#311111" }}>
                      <X className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#ef4444" }}>Mark Failed</p>
                      <p className="text-xs" style={{ color: "#5c1a1a" }}>End as a loss 💀</p>
                    </div>
                  </button>
                </div>

                <button onClick={close}
                  className="w-full py-3 rounded-2xl text-sm font-bold"
                  style={{ background: "#1c1c1c", color: "#555" }}>
                  Cancel
                </button>
              </motion.div>
            )}

            {/* Create */}
            {sheet === "create" && (
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
                style={{ background: "#161616", border: "1px solid #252525", borderBottom: "none",
                  paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>
                <div className="w-8 h-1 rounded-full mx-auto mb-1" style={{ background: "#2a2a2a" }} />
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base" style={{ color: "#f0f0f0" }}>New Challenge</h3>
                  <button onClick={close}><X className="w-4 h-4" style={{ color: "#555" }} /></button>
                </div>
                {renderForm(false,
                  { title, setTitle, desc, setDesc, startDate, setStartDate, date, setDate, stake, setStake },
                  handleCreate,
                )}
              </motion.div>
            )}

            {/* Edit */}
            {sheet === "edit" && (
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
                style={{ background: "#161616", border: "1px solid #252525", borderBottom: "none",
                  paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>
                <div className="w-8 h-1 rounded-full mx-auto mb-1" style={{ background: "#2a2a2a" }} />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-base" style={{ color: "#f0f0f0" }}>Edit Challenge</h3>
                    <p className="text-xs" style={{ color: "#555" }}>Changes apply immediately</p>
                  </div>
                  <button onClick={close}><X className="w-4 h-4" style={{ color: "#555" }} /></button>
                </div>
                {renderForm(true,
                  { title: editTitle, setTitle: setEditTitle, desc: editDesc, setDesc: setEditDesc,
                    startDate: editStartDate, setStartDate: setEditStartDate,
                    date: editDate, setDate: setEditDate, stake: editStake, setStake: setEditStake },
                  handleEdit,
                )}
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* ── Proof upload modal ── */}
      <AnimatePresence>
        {proofGoalId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => setProofGoalId(null)}>
            <motion.form
              onSubmit={handleProofSubmit}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl p-5 space-y-4"
              style={{ background: "#161616", border: "1px solid #252525", borderBottom: "none",
                paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>

              <div className="w-8 h-1 rounded-full mx-auto" style={{ background: "#2a2a2a" }} />
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base" style={{ color: "#f0f0f0" }}>🏆 Mark as Achieved</h3>
                <button type="button" onClick={() => setProofGoalId(null)}>
                  <X className="w-4 h-4" style={{ color: "#555" }} />
                </button>
              </div>

              {/* Win note */}
              <div>
                <p className="text-[11px] font-semibold mb-1.5" style={{ color: "#666" }}>Win note (optional)</p>
                <textarea rows={2} value={proofNote} onChange={(e) => setProofNote(e.target.value)}
                  placeholder='e.g. "Hit 200 LeetCode problems, feeling unstoppable 🔥"'
                  className="input-field" style={{ resize: "none", width: "100%" }} />
              </div>

              {/* Proof photo */}
              <div>
                <p className="text-[11px] font-semibold mb-1.5" style={{ color: "#666" }}>Proof photo (optional)</p>
                {proofPreview ? (
                  <div className="relative rounded-2xl overflow-hidden" style={{ height: 160 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={proofPreview} alt="proof" className="w-full h-full object-cover" />
                    <button type="button"
                      onClick={() => { setProofFile(null); setProofPreview(null); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.7)" }}>
                      <X className="w-3.5 h-3.5" style={{ color: "#f0f0f0" }} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer py-8"
                    style={{ border: "1.5px dashed #252525", background: "#111" }}>
                    <span style={{ fontSize: 28 }}>📸</span>
                    <p className="text-xs font-semibold" style={{ color: "#555" }}>Tap to attach screenshot or photo</p>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setProofFile(f);
                        setProofPreview(URL.createObjectURL(f));
                      }} />
                  </label>
                )}
              </div>

              <button type="submit" disabled={proofLoading}
                className="btn-primary w-full text-sm"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                {proofLoading ? "Saving…" : "🏆 Confirm Achievement"}
              </button>

              <button type="button" onClick={() => setProofGoalId(null)}
                className="w-full text-xs py-2" style={{ color: "#555" }}>
                Cancel
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

