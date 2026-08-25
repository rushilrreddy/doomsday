"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User as UserIcon, AlertCircle, Database, Skull, ShieldCheck, Flame } from "lucide-react";

interface LoginModalProps {
  onLoginSuccess: () => void;
}

const CREW = [
  { name: "rushil", color: "#22c55e", label: "Leader", title: "Doom Slayer" },
  { name: "alan",   color: "#7c5cfc", label: "Member", title: "Quantum Sorcerer" },
  { name: "kevin",  color: "#f5c518", label: "Member", title: "Time Keeper" },
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

  const selected = CREW.find((c) => c.name === username) || CREW[0];

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "#050505" }}>
      
      {/* Cinematic Doomsday Poster Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/doomsdayy.jpg"
          alt="Doomsday Background"
          className="w-full h-full object-cover object-top opacity-35 scale-105 filter contrast-125 saturate-110"
        />
        {/* Vignette & Gradients */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 50% 30%, rgba(5,5,5,0.2) 0%, rgba(5,5,5,0.85) 65%, #050505 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(5,5,5,0.4) 0%, rgba(5,5,5,0.8) 50%, #050505 95%)",
          }}
        />
        {/* Emerald Doom Glow at top center */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none opacity-20"
          style={{
            background: "radial-gradient(circle, #22c55e 0%, rgba(34,197,94,0) 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10 my-auto rounded-3xl p-6 backdrop-blur-xl"
        style={{
          background: "rgba(14, 14, 16, 0.78)",
          border: "1px solid rgba(34, 197, 94, 0.25)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px -10px rgba(34, 197, 94, 0.15)",
        }}
      >
        {/* Doomsday Banner Header */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
            style={{
              background: "rgba(34, 197, 94, 0.12)",
              color: "#22c55e",
              border: "1px solid rgba(34, 197, 94, 0.3)",
            }}>
            <Skull className="w-3 h-3" />
            Doomsday Protocol
          </div>

          <div>
            <h1
              className="text-3xl font-black uppercase tracking-widest text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(180deg, #ffffff 20%, #a3e635 70%, #22c55e 100%)",
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                textShadow: "0 0 20px rgba(34, 197, 94, 0.4)",
                letterSpacing: "0.15em",
              }}
            >
              DOOMSDAY
            </h1>
            <p className="text-xs font-bold tracking-wider mt-0.5" style={{ color: "#888", textTransform: "uppercase" }}>
              Countdown Crew
            </p>
          </div>

          <p className="text-[11px] leading-relaxed max-w-xs mx-auto" style={{ color: "#666" }}>
            Complete your daily missions or face the snap.
          </p>
        </div>

        {/* Character / Crew Selection */}
        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#555" }}>
              Select Survivor
            </span>
            <span className="text-[10px]" style={{ color: "#444" }}>PIN: crew123</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {CREW.map((c) => {
              const isSelected = username === c.name;
              return (
                <motion.button
                  key={c.name}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => { setUsername(c.name); setPassword("crew123"); }}
                  className="relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all"
                  style={{
                    background: isSelected ? "rgba(28, 28, 32, 0.9)" : "rgba(18, 18, 20, 0.5)",
                    border: isSelected ? `1.5px solid ${c.color}` : "1px solid rgba(40, 40, 45, 0.6)",
                    boxShadow: isSelected ? `0 0 15px -3px ${c.color}40` : "none",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black relative"
                    style={{
                      background: isSelected ? `${c.color}25` : "#161618",
                      color: isSelected ? c.color : "#666",
                      border: `1px solid ${isSelected ? c.color + "50" : "#282828"}`,
                    }}
                  >
                    {c.name[0].toUpperCase()}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                    )}
                  </div>

                  <div className="text-center">
                    <span className="text-xs font-black capitalize block" style={{ color: isSelected ? "#f0f0f0" : "#777" }}>
                      {c.name}
                    </span>
                    <span className="text-[8px] font-bold block leading-none mt-0.5" style={{ color: isSelected ? c.color : "#444" }}>
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
                placeholder="Survivor username"
                className="input-field pl-10"
                style={{
                  background: "rgba(10, 10, 12, 0.8)",
                  border: "1px solid #252528",
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
                placeholder="Access password"
                className="input-field pl-10"
                style={{
                  background: "rgba(10, 10, 12, 0.8)",
                  border: "1px solid #252528",
                  borderRadius: 14,
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            style={{
              background: loading
                ? "#252525"
                : `linear-gradient(135deg, ${selected.color}, #16a34a)`,
              color: "#050505",
              boxShadow: `0 0 20px -3px ${selected.color}60`,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Flame className="w-3.5 h-3.5" />
            {loading ? "Authenticating..." : `Enter as ${username}`}
          </motion.button>
        </form>

        {/* Database Seed Helper */}
        <div className="mt-4 pt-3 text-center" style={{ borderTop: "1px solid rgba(40, 40, 45, 0.5)" }}>
          <button
            type="button"
            onClick={handleSeed}
            disabled={seedLoading}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
            style={{ color: "#555" }}
          >
            <Database className="w-3 h-3" />
            {seedLoading ? "Initializing schema..." : "First time? Initialize database"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
