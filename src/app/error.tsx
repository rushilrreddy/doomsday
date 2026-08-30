"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Application Error Caught:", error);
  }, [error]);

  return (
    <div
      className="min-h-dvh flex items-center justify-center p-4"
      style={{ background: "#0a0a0a", color: "#ffffff" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 space-y-4 text-center"
        style={{
          background: "linear-gradient(135deg, #181216, #0e0d12)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.8)",
        }}
      >
        <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-black text-white">System Recovered</h2>
          <p className="text-xs text-gray-400">
            A temporary connection or render glitch occurred. Your data is safe.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-red-500/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload App
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = "/"; }}
            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
