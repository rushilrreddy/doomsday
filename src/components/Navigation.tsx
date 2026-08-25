"use client";

import React from "react";
import { motion } from "framer-motion";
import { User } from "@/lib/types";
import { Home, CheckSquare, BookOpen, Settings, LogOut, Repeat2, BarChart2, GraduationCap } from "lucide-react";

export type TabType = "countdown" | "tasks" | "routines" | "study" | "stats" | "notes";

const TABS = [
  { id: "countdown" as TabType, icon: Home,           label: "Home"    },
  { id: "tasks"     as TabType, icon: CheckSquare,    label: "Tasks"   },
  { id: "routines"  as TabType, icon: Repeat2,        label: "Routines"},
  { id: "study"     as TabType, icon: GraduationCap,  label: "Study"   },
  { id: "stats"     as TabType, icon: BarChart2,      label: "Stats"   },
  { id: "notes"     as TabType, icon: BookOpen,       label: "Notes"   },
];

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  alan: "#7c5cfc",
  kevin: "#f5c518",
};

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentUser: User;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export function Navigation({ activeTab, setActiveTab, currentUser, onOpenAdmin, onLogout }: NavigationProps) {
  const color = USER_COLORS[currentUser.username.toLowerCase()] || "#888";

  return (
    <>
      {/* Top Header */}
      <header
        className="sticky top-0 z-40 px-5 py-3.5"
        style={{ background: "#0a0a0a", borderBottom: "1px solid #161616" }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
              style={{ background: `${color}18`, color }}
            >
              {currentUser.username[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[10px]" style={{ color: "#555" }}>
                {currentUser.role === "leader" ? "Leader" : "Member"}
              </p>
              <p className="text-sm font-bold capitalize leading-tight" style={{ color: "#f0f0f0" }}>
                {currentUser.username}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {currentUser.role === "leader" && (
              <motion.button whileTap={{ scale: 0.92 }} onClick={onOpenAdmin} className="btn-ghost" title="Admin">
                <Settings style={{ width: 18, height: 18 }} />
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.92 }} onClick={onLogout} className="btn-ghost" title="Logout">
              <LogOut style={{ width: 18, height: 18 }} />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Bottom nav — 5 tabs */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 px-2 py-2"
        style={{
          background: "#0a0a0a",
          borderTop: "1px solid #161616",
          paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex flex-col items-center gap-0.5 py-1.5 px-3"
              >
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: "#1c1c1c" }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon
                  style={{
                    width: 17, height: 17,
                    color: active ? "#f0f0f0" : "#3a3a3a",
                    position: "relative", zIndex: 1,
                  }}
                />
                <span style={{
                  fontSize: 8, fontWeight: active ? 700 : 500,
                  color: active ? "#f0f0f0" : "#3a3a3a",
                  position: "relative", zIndex: 1, letterSpacing: "0.03em",
                }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
