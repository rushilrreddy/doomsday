"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Toast { id: string; content: string; }

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (content: string) => {
    const id = Math.random().toString(36).slice(2, 8);
    setToasts((prev) => [...prev.slice(-2), { id, content }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  };

  useEffect(() => {
    const ch = supabase.channel("crew-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tasks" }, (p) => {
        if (p.new.is_done) addToast("✅ A task was just checked off!");
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_feed" }, (p) => {
        if (p.new.content) addToast(p.new.content);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () => {
        addToast("🎯 Challenge updated!");
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <>
      {children}
      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div key={toast.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-2xl shadow-float"
              style={{ background: "#1c1c1c", border: "1px solid #2a2a2a" }}>
              <Bell className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#7c5cfc" }} />
              <p className="text-xs flex-1 leading-snug" style={{ color: "#d0d0d0" }}>{toast.content}</p>
              <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="shrink-0" style={{ color: "#444" }}>
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
