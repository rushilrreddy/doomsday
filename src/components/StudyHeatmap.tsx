"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { StudyLog, User } from "@/lib/types";
import { CalendarDays } from "lucide-react";

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  pruthvi: "#7c5cfc",
  kevin:  "#f5c518",
};

interface StudyHeatmapProps {
  logs:        StudyLog[];
  users:       User[];
  currentUser: User;
}

function getIntensityColor(count: number, baseColor: string): string {
  if (count === 0) return "#141414";
  const hex = baseColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const alpha = count === 1 ? 0.25 : count === 2 ? 0.45 : count <= 4 ? 0.65 : 0.9;
  return `rgba(${r},${g},${b},${alpha})`;
}

function formatDuration(mins: number) {
  if (!mins) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function StudyHeatmap({ logs = [], users = [], currentUser }: StudyHeatmapProps) {
  const [selectedUser, setSelectedUser] = useState(() => currentUser?.username?.toLowerCase() || "rushil");
  const [tooltip, setTooltip] = useState<{
    date: string; count: number; problems: number; minutes: number; x: number; y: number;
  } | null>(null);

  const safeUsers = users || [];
  const safeLogs = logs || [];

  const userObj = safeUsers.find((u) => u && u.username && u.username.toLowerCase() === selectedUser) || currentUser;
  const baseColor = USER_COLORS[selectedUser] || "#7c5cfc";

  // Build 90-day grid
  const { weeks, dateMap } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Go back 89 days to get 90 days total
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 89);

    // Pad to Monday of that week
    const dayOfWeek = startDate.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    // Build date → stats map for selected user
    const userLogs = safeLogs.filter((l) => l && userObj && l.user_id === userObj.id);
    const dateMap: Record<string, { count: number; problems: number; minutes: number }> = {};
    for (const l of userLogs) {
      if (!dateMap[l.log_date]) dateMap[l.log_date] = { count: 0, problems: 0, minutes: 0 };
      dateMap[l.log_date].count++;
      dateMap[l.log_date].problems += (l.problems_solved || 0);
      dateMap[l.log_date].minutes  += (l.duration_minutes || 0);
    }

    // Build weeks array (each week = 7 days Mon–Sun)
    const weeks: Array<Array<{ date: string; inRange: boolean }>> = [];
    const cur = new Date(startDate);

    while (cur <= today || weeks.length === 0 || weeks[weeks.length - 1].length < 7) {
      if (weeks.length === 0 || weeks[weeks.length - 1].length === 7) weeks.push([]);
      const dateStr = cur.toISOString().split("T")[0];
      const inRange = cur <= today;
      weeks[weeks.length - 1].push({ date: dateStr, inRange });
      cur.setDate(cur.getDate() + 1);
      if (weeks.length > 14) break; // safety
    }

    return { weeks, dateMap };
  }, [safeLogs, userObj?.id]);

  // Stats summary
  const totalSessions = Object.values(dateMap).reduce((s, v) => s + v.count, 0);
  const totalProblems = Object.values(dateMap).reduce((s, v) => s + v.problems, 0);
  const activeDays    = Object.values(dateMap).filter((v) => v.count > 0).length;

  const DAYS = ["M", "W", "F"];
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Month labels positioned over weeks
  const monthLabels = useMemo(() => {
    const labels: Array<{ month: string; weekIndex: number }> = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstDay = week[0]?.date;
      if (!firstDay) return;
      const m = new Date(firstDay + "T12:00:00").getMonth();
      if (m !== lastMonth) {
        labels.push({ month: MONTHS[m], weekIndex: wi });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks]);

  const CELL = 11;
  const GAP  = 2;
  const STEP = CELL + GAP;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4" style={{ color: "#555" }} />
        <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>Study Heatmap</h2>
      </div>

      {/* User selector */}
      <div className="flex gap-2">
        {users.filter((u) => ["rushil","pruthvi","kevin"].includes(u.username.toLowerCase())).map((u) => {
          const uname = u.username.toLowerCase();
          const c     = USER_COLORS[uname] || "#666";
          const active = selectedUser === uname;
          return (
            <button key={u.id} onClick={() => setSelectedUser(uname)}
              className="flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition-all"
              style={{
                background: active ? `${c}18` : "#161616",
                color:      active ? c        : "#444",
                border:     active ? `1px solid ${c}35` : "1px solid #1e1e1e",
              }}>
              {u.username}
            </button>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Sessions", value: totalSessions },
          { label: "Problems", value: totalProblems },
          { label: "Active days", value: activeDays },
        ].map(({ label, value }) => (
          <div key={label} className="card p-3 text-center">
            <p className="text-lg font-black tabular-nums" style={{ color: baseColor }}>{value}</p>
            <p className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: "#444" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="card p-4 overflow-x-auto">
        <div className="relative" style={{ minWidth: weeks.length * STEP + 20 }}>
          {/* Month labels */}
          <div className="flex mb-1" style={{ paddingLeft: 16 }}>
            {monthLabels.map(({ month, weekIndex }) => (
              <div key={`${month}-${weekIndex}`}
                style={{
                  position: "absolute", left: 16 + weekIndex * STEP,
                  fontSize: 9, color: "#444", fontWeight: 600,
                }}>
                {month}
              </div>
            ))}
          </div>

          <div className="flex gap-0.5 mt-4">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {["M","","W","","F","",""].map((d, i) => (
                <div key={i} style={{ height: CELL, fontSize: 8, color: "#444", fontWeight: 600,
                  display: "flex", alignItems: "center" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map(({ date, inRange }, di) => {
                  const stats = dateMap[date];
                  const count = stats?.count || 0;
                  const isToday = date === new Date().toISOString().split("T")[0];

                  return (
                    <motion.div
                      key={date}
                      whileHover={{ scale: 1.3 }}
                      onHoverStart={(e) => {
                        if (!inRange || !stats) return;
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setTooltip({ date, count, problems: stats.problems, minutes: stats.minutes, x: rect.left, y: rect.top });
                      }}
                      onHoverEnd={() => setTooltip(null)}
                      style={{
                        width: CELL, height: CELL,
                        borderRadius: 2,
                        background: inRange ? getIntensityColor(count, baseColor) : "transparent",
                        border: isToday ? `1px solid ${baseColor}` : "none",
                        cursor: inRange && count > 0 ? "pointer" : "default",
                        opacity: inRange ? 1 : 0,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1 mt-3 justify-end">
            <span style={{ fontSize: 9, color: "#444" }}>Less</span>
            {[0, 1, 2, 3, 5].map((n) => (
              <div key={n} style={{
                width: CELL, height: CELL, borderRadius: 2,
                background: getIntensityColor(n, baseColor),
              }} />
            ))}
            <span style={{ fontSize: 9, color: "#444" }}>More</span>
          </div>
        </div>
      </div>

      {/* Tooltip (fixed position) */}
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-xl text-xs shadow-xl"
          style={{
            left: Math.min(tooltip.x, window.innerWidth - 180),
            top:  tooltip.y - 70,
            background: "#1c1c1c",
            border: `1px solid ${baseColor}30`,
            color: "#d0d0d0",
          }}
        >
          <p className="font-bold" style={{ color: "#f0f0f0" }}>
            {new Date(tooltip.date + "T12:00:00").toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
          </p>
          <p>{tooltip.count} session{tooltip.count !== 1 ? "s" : ""}</p>
          {tooltip.problems > 0 && <p>{tooltip.problems} problems</p>}
          {tooltip.minutes > 0  && <p>{formatDuration(tooltip.minutes)}</p>}
        </motion.div>
      )}
    </div>
  );
}
