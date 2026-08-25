"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@/lib/types";
import { Shield, KeyRound, UserPlus, Power, AlertCircle, CheckCircle, X } from "lucide-react";

interface LeaderAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onRefreshUsers: () => void;
}

export function LeaderAdminPanel({ isOpen, onClose, currentUser, onRefreshUsers }: LeaderAdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [resetUserId, setResetUserId] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newInitPass, setNewInitPass] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
      if (data.users?.length && !resetUserId) setResetUserId(data.users[0].id);
    }
  }, [resetUserId]);

  useEffect(() => { if (isOpen) fetchUsers(); }, [isOpen, fetchUsers]);

  const call = async (body: object) => {
    setLoading(true); setMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ text: data.message || "Done!", ok: true });
      fetchUsers(); onRefreshUsers();
    } catch (e: unknown) {
      setMessage({ text: e instanceof Error ? e.message : "Error", ok: false });
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-t-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
          style={{ background: "#111", border: "1px solid #222", borderBottom: "none" }}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "#1c1c1c" }}>
                <Shield className="w-4 h-4" style={{ color: "#f5c518" }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "#f0f0f0" }}>Admin Controls</p>
                <p className="text-xs" style={{ color: "#555" }}>Leader: {currentUser.username}</p>
              </div>
            </div>
            <button onClick={onClose} className="btn-ghost">
              <X className="w-4 h-4" />
            </button>
          </div>

          {message && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
              style={{
                background: message.ok ? "#0d1a10" : "#1a0d0d",
                border: `1px solid ${message.ok ? "#22c55e25" : "#ef444425"}`,
              }}>
              {message.ok ? <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#22c55e" }} />
                : <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#ef4444" }} />}
              <p className="text-xs" style={{ color: message.ok ? "#22c55e" : "#ef4444" }}>{message.text}</p>
            </div>
          )}

          {/* Reset password */}
          <section className="space-y-3 p-4 rounded-2xl" style={{ background: "#161616", border: "1px solid #222" }}>
            <p className="section-title flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Reset Password
            </p>
            <select value={resetUserId} onChange={(e) => setResetUserId(e.target.value)} className="input-field">
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
              ))}
            </select>
            <input type="password" minLength={4} placeholder="New password" value={newPass}
              onChange={(e) => setNewPass(e.target.value)} className="input-field" />
            <button onClick={() => call({ action: "reset_password", userId: resetUserId, newPassword: newPass })}
              disabled={loading || !newPass}
              className="btn-primary w-full text-sm py-3">
              {loading ? "Updating..." : "Update Password"}
            </button>
          </section>

          {/* Add user */}
          <section className="space-y-3 p-4 rounded-2xl" style={{ background: "#161616", border: "1px solid #222" }}>
            <p className="section-title flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" /> Add Member
            </p>
            <input placeholder="Username" value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)} className="input-field" />
            <input type="password" minLength={4} placeholder="Initial password" value={newInitPass}
              onChange={(e) => setNewInitPass(e.target.value)} className="input-field" />
            <button onClick={() => call({ action: "create_user", username: newUsername, password: newInitPass })}
              disabled={loading || !newUsername || !newInitPass}
              className="btn-secondary w-full text-sm py-3">
              {loading ? "Creating..." : "Create Account"}
            </button>
          </section>

          {/* Roster */}
          <section className="space-y-2">
            <p className="section-title">Crew Roster</p>
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 rounded-2xl"
                style={{ background: "#161616", border: "1px solid #1e1e1e" }}>
                <div>
                  <span className="text-sm font-bold capitalize" style={{ color: "#f0f0f0" }}>{u.username}</span>
                  <span className="text-xs ml-2" style={{ color: "#555" }}>{u.role} · {u.status}</span>
                </div>
                {u.id !== currentUser.id && (
                  <button onClick={() => call({ action: "toggle_status", userId: u.id, status: u.status === "active" ? "inactive" : "active" })}
                    disabled={loading}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl"
                    style={{
                      background: u.status === "active" ? "#1a0d0d" : "#0d1a10",
                      color: u.status === "active" ? "#ef4444" : "#22c55e",
                      border: `1px solid ${u.status === "active" ? "#ef444425" : "#22c55e25"}`,
                    }}>
                    <Power className="w-3 h-3" />
                    {u.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                )}
              </div>
            ))}
          </section>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
