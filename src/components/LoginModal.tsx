"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User as UserIcon, AlertCircle, Database, ArrowRight, ShieldCheck } from "lucide-react";

interface LoginModalProps {
  onLoginSuccess: () => void;
}

const CREW = [
  { name: "rushil", color: "#22c55e", label: "Leader" },
  { name: "pruthvi", color: "#7c5cfc", label: "Member" },
  { name: "kevin",  color: "#f5c518", label: "Member" },
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
      setSeedMessage("Database ready. Default password: crew123");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Seed error");
    } finally {
      setSeedLoading(false);
    }
  };

  const selected = CREW.find((c) => c.name === username) || CREW[0];

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "#050505" }}>
      
      {/* Prominent Doomsday Poster Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/doomsdayy.jpg"
          alt="Doomsday"
          className="w-full h-full object-cover object-top opacity-70 scale-100 filter contrast-110 brightness-90"
        />
        {/* Subtle cinematic overlays for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 25%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 60%, #050505 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(5,5,5,0.2) 0%, rgba(5,5,5,0.6) 45%, #050505 92%)",
          }}
        />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10 my-auto rounded-3xl p-6 backdrop-blur-2xl"
        style={{
          background: "rgba(12, 13, 16, 0.82)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 30px -10px rgba(34, 197, 94, 0.12)",
        }}
      >
        {/* Header */}
        <div className="text-center mb-6 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase mb-1"
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              color: "#22c55e",
              border: "1px solid rgba(34, 197, 94, 0.25)",
            }}>
            Private Crew Access
          </div>

          <h1
            className="text-3xl font-black tracking-wider text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(180deg, #ffffff 30%, #e2e8f0 70%, #94a3b8 100%)",
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              letterSpacing: "0.1em",
            }}
          >
            DOOMSDAY
          </h1>

          <p className="text-xs font-semibold" style={{ color: "#777" }}>
            Countdown Crew · Progress & Bet Tracker
          </p>
        </div>

        {/* Member Selector */}
        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#666" }}>
              Select Member
            </span>
            <span className="text-[10px]" style={{ color: "#444" }}>Default PIN: crew123</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {CREW.map((c) => {
              const isSelected = username === c.name;
              return (
                <motion.button
                  key={c.name}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setUsername(c.name); setPassword("crew123"); }}
                  className="relative flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-2xl transition-all"
                  style={{
                    background: isSelected ? "rgba(25, 27, 32, 0.95)" : "rgba(18, 18, 22, 0.5)",
                    border: isSelected ? `1.5px solid ${c.color}` : "1px solid rgba(255, 255, 255, 0.05)",
                    boxShadow: isSelected ? `0 0 16px -4px ${c.color}40` : "none",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
                    style={{
                      background: isSelected ? `${c.color}20` : "#18181c",
                      color: isSelected ? c.color : "#666",
                      border: `1px solid ${isSelected ? c.color + "40" : "#242428"}`,
                    }}
                  >
                    {c.name[0].toUpperCase()}
                  </div>

                  <div className="text-center">
                    <span className="text-xs font-bold capitalize block" style={{ color: isSelected ? "#f0f0f0" : "#777" }}>
                      {c.name}
                    </span>
                    <span className="text-[9px] font-medium block leading-none mt-0.5" style={{ color: isSelected ? c.color : "#444" }}>
                      {c.label}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Error / Status Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 px-3.5 py-2.5 rounded-xl flex items-center gap-2"
              style={{ background: "#200a0a", border: "1px solid #ef444440" }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#ef4444" }} />
              <p className="text-xs font-medium" style={{ color: "#ef4444" }}>{error}</p>
            </motion.div>
          )}

          {seedMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 px-3.5 py-2.5 rounded-xl flex items-center gap-2"
              style={{ background: "#0a1f11", border: "1px solid #22c55e40" }}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: "#22c55e" }} />
              <p className="text-xs font-medium" style={{ color: "#22c55e" }}>{seedMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Inputs */}
        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#555" }} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="input-field pl-10"
                style={{
                  background: "rgba(10, 10, 14, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 14,
                }}
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#555" }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input-field pl-10"
                style={{
                  background: "rgba(10, 10, 14, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 14,
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
            style={{
              background: loading
                ? "#252525"
                : `linear-gradient(135deg, ${selected.color}, #16a34a)`,
              color: "#050505",
              boxShadow: `0 0 20px -3px ${selected.color}50`,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <span>{loading ? "Signing in..." : `Sign in as ${username}`}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </form>

        {/* Database Seed Helper */}
        <div className="mt-4 pt-3 text-center" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <button
            type="button"
            onClick={handleSeed}
            disabled={seedLoading}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors"
            style={{ color: "#555" }}
          >
            <Database className="w-3 h-3" />
            {seedLoading ? "Setting up database..." : "First time? Initialize database"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
