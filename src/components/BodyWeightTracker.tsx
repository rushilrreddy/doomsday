"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BodyWeightLog, User } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Scale, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface BodyWeightTrackerProps {
  logs: BodyWeightLog[];
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

/** Mini SVG sparkline */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 200;
  const h = 48;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 48 }}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
      {/* End dot */}
      {(() => {
        const last = pts[pts.length - 1].split(",");
        return <circle cx={last[0]} cy={last[1]} r="3" fill={color} />;
      })()}
    </svg>
  );
}

export function BodyWeightTracker({ logs, users, currentUser, onRefresh }: BodyWeightTrackerProps) {
  const [selected, setSelected] = useState(currentUser.username.toLowerCase());
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const selectedUser = users.find((u) => u.username.toLowerCase() === selected) || currentUser;
  const isSelf = selectedUser.id === currentUser.id;
  const color = USER_COLORS[selected] || "#888";

  // Last 14 days for selected user
  const userLogs = useMemo(
    () => logs.filter((l) => l.user_id === selectedUser.id)
      .sort((a, b) => a.log_date.localeCompare(b.log_date))
      .slice(-14),
    [logs, selectedUser.id]
  );
  const todayLog = userLogs.find((l) => l.log_date === todayStr);
  const values = userLogs.map((l) => Number(l.weight));
  const current = values[values.length - 1];
  const prev = values[values.length - 2];
  const diff = current != null && prev != null ? (current - prev) : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return;
    setLoading(true);
    try {
      await supabase.from("body_weight_logs").upsert([{
        user_id: currentUser.id,
        weight: w,
        unit,
        note: note.trim() || null,
        log_date: todayStr,
        created_at: new Date().toISOString(),
      }], { onConflict: "user_id,log_date" });
      await supabase.from("activity_feed").insert([{
        user_id: currentUser.id, type: "weight_logged",
        content: `${currentUser.username} logged weight: ${w}${unit} 📊`,
      }]);
      setWeight(""); setNote(""); setEditing(false);
      onRefresh();
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Scale className="w-4 h-4" style={{ color: "#555" }} />
        <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>Body Weight</h2>
      </div>

      {/* Friend tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CREW.map((uname) => {
          const c = USER_COLORS[uname];
          const active = selected === uname;
          const u = users.find((usr) => usr.username.toLowerCase() === uname);
          const lastLog = logs.filter((l) => l.user_id === u?.id).sort((a,b)=>b.log_date.localeCompare(a.log_date))[0];
          return (
            <motion.button key={uname} whileTap={{ scale: 0.95 }}
              onClick={() => setSelected(uname)}
              className="flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-2xl text-xs font-bold capitalize"
              style={{
                background: active ? `${c}15` : "#161616",
                border: active ? `1px solid ${c}35` : "1px solid #222",
                color: active ? c : "#666",
              }}>
              <span>{uname}</span>
              <span className="text-[10px]" style={{ color: active ? c : "#444" }}>
                {lastLog ? `${lastLog.weight}${lastLog.unit}` : "—"}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Main card */}
      <div className="card p-4 space-y-4">
        {/* Current weight display */}
        {values.length > 0 && (
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black tabular-nums" style={{ color: "#f0f0f0" }}>
                {current}<span className="text-base font-bold ml-1" style={{ color: "#555" }}>{userLogs[userLogs.length-1]?.unit || "kg"}</span>
              </p>
              {diff != null && (
                <div className="flex items-center gap-1 mt-1">
                  {diff > 0 ? <TrendingUp className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
                    : diff < 0 ? <TrendingDown className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
                    : <Minus className="w-3.5 h-3.5" style={{ color: "#555" }} />}
                  <span className="text-xs font-bold"
                    style={{ color: diff > 0 ? "#ef4444" : diff < 0 ? "#22c55e" : "#555" }}>
                    {diff > 0 ? "+" : ""}{diff.toFixed(1)} vs yesterday
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px]" style={{ color: "#444" }}>14-day range</p>
              <p className="text-xs font-bold" style={{ color: "#666" }}>
                {Math.min(...values).toFixed(1)} – {Math.max(...values).toFixed(1)}
              </p>
            </div>
          </div>
        )}

        {/* Sparkline */}
        {values.length >= 2 && (
          <div>
            <Sparkline values={values} color={color} />
            <div className="flex justify-between mt-1">
              <span className="text-[9px]" style={{ color: "#444" }}>
                {userLogs[0]?.log_date ? new Date(userLogs[0].log_date + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" }) : ""}
              </span>
              <span className="text-[9px]" style={{ color: "#444" }}>Today</span>
            </div>
          </div>
        )}

        {/* Log / Edit form */}
        {isSelf && (
          <div>
            {todayLog && !editing ? (
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: "#555" }}>
                  Logged today: <span className="font-bold" style={{ color: "#888" }}>{todayLog.weight}{todayLog.unit}</span>
                </p>
                <button onClick={() => { setWeight(String(todayLog.weight)); setUnit(todayLog.unit); setNote(todayLog.note||""); setEditing(true); }}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl"
                  style={{ background: "#1c1c1c", color: "#888" }}>
                  Edit
                </button>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-2.5">
                <div className="flex gap-2">
                  <input
                    required
                    type="number"
                    step="0.1"
                    min="20"
                    max="400"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={`Weight (${unit})`}
                    className="input-field flex-1"
                  />
                  {/* kg/lbs toggle */}
                  <button type="button" onClick={() => setUnit(unit === "kg" ? "lbs" : "kg")}
                    className="px-4 rounded-xl text-xs font-black shrink-0"
                    style={{ background: "#1c1c1c", color: "#f0f0f0", border: "1px solid #252525" }}>
                    {unit}
                  </button>
                </div>
                <input value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Note (optional)" className="input-field" />
                <div className="flex gap-2">
                  {editing && (
                    <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1 text-sm py-2.5">
                      Cancel
                    </button>
                  )}
                  <button type="submit" disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: color, color: "#0a0a0a" }}>
                    {loading ? "Saving..." : todayLog ? "Update" : "Log Weight"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* No data */}
        {values.length === 0 && !isSelf && (
          <p className="text-sm text-center py-2" style={{ color: "#444" }}>
            {selected} hasn&apos;t logged weight yet.
          </p>
        )}
      </div>
    </div>
  );
}
