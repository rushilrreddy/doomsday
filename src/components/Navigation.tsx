"use client";

import React from "react";
import { motion } from "framer-motion";
import { User } from "@/lib/types";
import { Home, CheckSquare, GraduationCap, BarChart2, Settings, Shield } from "lucide-react";

export type TabType = "countdown" | "tasks" | "study" | "stats" | "settings";

const TABS = [
  { id: "countdown" as TabType, icon: Home,          label: "Home"     },
  { id: "tasks"     as TabType, icon: CheckSquare,   label: "Execution"},
  { id: "study"     as TabType, icon: GraduationCap, label: "Study"    },
  { id: "stats"     as TabType, icon: BarChart2,     label: "Analytics"},
  { id: "settings"  as TabType, icon: Settings,      label: "Settings" },
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
  level?: number;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export function Navigation({ activeTab, setActiveTab, currentUser, level, onOpenAdmin, onLogout }: NavigationProps) {
  const color = USER_COLORS[currentUser.username.toLowerCase()] || "#888";
  const isLeader = currentUser.username.toLowerCase() === "rushil" || currentUser.role === "leader";

  return (
    <>
      {/* Top Header */}
      <header
        className="sticky top-0 z-40 px-5 py-3.5"
        style={{
          background: "rgba(10, 10, 12, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
        }}
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
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold capitalize leading-tight text-white">
                  {currentUser.username}
                </p>
                {level !== undefined && (
                  <span
                    className="text-[9px] font-black px-1.5 py-0.2 rounded-md"
                    style={{ background: "#7c5cfc25", color: "#a78bfa" }}
                  >
                    Lv.{level}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 font-medium">
                {isLeader ? "Crew Leader" : "Crew Member"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isLeader && (
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Master
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Nav Bar — 5 Clean Tabs */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 px-2 py-2"
        style={{
          background: "rgba(10, 10, 12, 0.96)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
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
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-colors"
              >
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: "rgba(255, 255, 255, 0.08)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon
                  style={{
                    width: 18,
                    height: 18,
                    color: active ? "#ffffff" : "#666670",
                    position: "relative",
                    zIndex: 1,
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: active ? 700 : 500,
                    color: active ? "#ffffff" : "#666670",
                    position: "relative",
                    zIndex: 1,
                    letterSpacing: "0.02em",
                  }}
                >
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
