"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, User as UserIcon, AlertCircle, Database, Zap } from "lucide-react";

interface LoginModalProps {
  onLoginSuccess: () => void;
}

const CREW = [
  { name: "rushil", color: "#22c55e", label: "Leader" },
  { name: "alan", color: "#7c5cfc", label: "Member" },
  { name: "kevin", color: "#f5c518", label: "Member" },
];

export function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState("rushil");
  const [password, setPassword] = useState("crew123");
  const [error, setError] = useState<string | null>(null);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      onLoginSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeedLoading(true);
    setError(null);
    setSeedMessage(null);
    try {
      const res = await fetch("/api/seed");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed failed");
      setSeedMessage("Database initialized! Use password: crew123");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Seed error");
    } finally {
      setSeedLoading(false);
    }
  };

  const selected = CREW.find((c) => c.name === username);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5"
      style={{ background: "#0a0a0a" }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "#161616", border: "1px solid #242424" }}>
              <Zap className="w-5 h-5" style={{ color: "#f5c518" }} />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#555" }}>
                Private Access
              </p>
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "#f0f0f0", lineHeight: 1.1 }}>
            Countdown<br />Crew
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#666" }}>
            Friends · Goals · Bets · Streaks
          </p>
        </div>

        {/* Crew Selector */}
        <div className="mb-5">
          <p className="section-title mb-3">Choose Account</p>
          <div className="grid grid-cols-3 gap-2">
            {CREW.map((c) => {
              const isSelected = username === c.name;
              return (
                <motion.button
                  key={c.name}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setUsername(c.name); setPassword("crew123"); }}
                  className="relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all"
                  style={{
                    background: isSelected ? "#1c1c1c" : "transparent",
                    border: isSelected ? `1px solid ${c.color}30` : "1px solid #1a1a1a",
                  }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: isSelected ? `${c.color}18` : "#161616" }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                  </div>
                  <span className="text-xs font-bold capitalize" style={{ color: isSelected ? "#f0f0f0" : "#666" }}>
                    {c.name}
                  </span>
                  {c.label === "Leader" && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                      style={{ background: `${c.color}18`, color: c.color }}>
                      Leader
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Error/Seed message */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-2.5"
            style={{ background: "#1a0d0d", border: "1px solid #3a1010" }}>
            <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#ef4444" }} />
            <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
          </div>
        )}
        {seedMessage && (
          <div className="mb-4 px-4 py-3 rounded-2xl"
            style={{ background: "#0d1a10", border: "1px solid #103a18" }}>
            <p className="text-xs" style={{ color: "#22c55e" }}>{seedMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: "#555" }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="input-field pl-11"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: "#555" }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="input-field pl-11"
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl font-bold text-sm"
            style={{
              background: selected?.color || "#f0f0f0",
              color: "#0a0a0a",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Signing in..." : `Enter as ${username}`}
          </motion.button>
        </form>

        {/* Seed helper */}
        <div className="mt-5 pt-5" style={{ borderTop: "1px solid #1a1a1a" }}>
          <button
            onClick={handleSeed}
            disabled={seedLoading}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold"
            style={{ color: "#555" }}
          >
            <Database className="w-3.5 h-3.5" />
            {seedLoading ? "Initializing..." : "Initialize database (first time setup)"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
