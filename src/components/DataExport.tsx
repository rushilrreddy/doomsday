"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, Check } from "lucide-react";
import { Task, StudyLog, DailyCheckin, User } from "@/lib/types";

interface DataExportProps {
  tasks:      Task[];
  studyLogs:  StudyLog[];
  checkins:   DailyCheckin[];
  currentUser:User;
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = String(r[h] ?? "").replace(/"/g, '""');
        return v.includes(",") || v.includes('"') || v.includes("\n") ? `"${v}"` : v;
      }).join(",")
    ),
  ];
  return lines.join("\n");
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function DataExport({ tasks, studyLogs, checkins, currentUser }: DataExportProps) {
  const [done, setDone] = useState<string | null>(null);

  const exports = [
    {
      id:    "study",
      label: "Study Logs",
      desc:  "All study sessions with subject, problems, duration",
      emoji: "📚",
      fn: () => {
        const rows = studyLogs
          .filter((l) => l.user_id === currentUser.id)
          .map((l) => ({
            date:            l.log_date,
            category:        l.category,
            subject:         l.subject,
            topic:           l.topic || "",
            problems_solved: l.problems_solved,
            duration_min:    l.duration_minutes,
            difficulty:      l.difficulty || "",
            platform:        l.platform || "",
            notes:           l.notes || "",
            private:         l.is_private ? "yes" : "no",
          }));
        download(`study_logs_${currentUser.username}_${new Date().toISOString().split("T")[0]}.csv`, toCSV(rows));
      },
    },
    {
      id:    "tasks",
      label: "Task History",
      desc:  "All tasks with completion status and dates",
      emoji: "✅",
      fn: () => {
        const rows = tasks
          .filter((t) => t.user_id === currentUser.id)
          .map((t) => ({
            date:      t.task_date,
            task:      t.title,
            completed: t.is_done ? "yes" : "no",
          }));
        download(`tasks_${currentUser.username}_${new Date().toISOString().split("T")[0]}.csv`, toCSV(rows));
      },
    },
    {
      id:    "checkins",
      label: "Daily Check-ins",
      desc:  "All daily check-in notes and mood",
      emoji: "📋",
      fn: () => {
        const rows = checkins
          .filter((c) => c.user_id === currentUser.id)
          .map((c) => ({
            date:    c.checkin_date,
            note:    c.note || "",
            mood:    c.mood || "",
            energy:  c.energy_level || "",
          }));
        download(`checkins_${currentUser.username}_${new Date().toISOString().split("T")[0]}.csv`, toCSV(rows));
      },
    },
  ];

  const handleExport = (ex: typeof exports[0]) => {
    ex.fn();
    setDone(ex.id);
    setTimeout(() => setDone(null), 2500);
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4" style={{ color: "#555" }} />
        <p className="font-bold text-sm" style={{ color: "#f0f0f0" }}>Export My Data</p>
      </div>

      <div className="space-y-2">
        {exports.map((ex) => {
          const isDone = done === ex.id;
          return (
            <motion.button
              key={ex.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleExport(ex)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
              style={{
                background: isDone ? "#0d1a10" : "#1c1c1c",
                border:     `1px solid ${isDone ? "#22c55e25" : "#252525"}`,
              }}
            >
              <span style={{ fontSize: 18 }}>{ex.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold" style={{ color: isDone ? "#22c55e" : "#f0f0f0" }}>{ex.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>{ex.desc}</p>
              </div>
              {isDone
                ? <Check className="w-4 h-4 shrink-0" style={{ color: "#22c55e" }} />
                : <Download className="w-3.5 h-3.5 shrink-0" style={{ color: "#444" }} />
              }
            </motion.button>
          );
        })}
      </div>

      <p className="text-[10px]" style={{ color: "#333" }}>
        Downloads as CSV — open in Excel, Google Sheets, or any text editor.
      </p>
    </div>
  );
}
