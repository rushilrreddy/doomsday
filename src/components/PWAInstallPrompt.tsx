"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share, PlusSquare, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker registered successfully"))
        .catch((err) => console.error("SW registration failed", err));
    }

    // Android/Chrome Install Prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // iOS Detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: boolean }).MSStream;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

    if (isIOS && !isStandalone) {
      setShowIOSBanner(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {/* Android/Desktop Chrome Install Banner */}
      {showInstallBtn && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto glass-card rounded-2xl p-4 border border-indigo-500/40 shadow-xl flex items-center justify-between gap-3 text-white"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Download className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold">Install Countdown Crew App</p>
              <p className="text-[10px] text-gray-400">Pin to home screen for instant live counter access!</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 font-bold text-xs shadow-md shadow-indigo-500/30"
            >
              Install
            </button>
            <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* iOS Safari Add to Home Screen Instructions */}
      {showIOSBanner && !showInstallBtn && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto glass-card rounded-2xl p-4 border border-amber-500/40 shadow-xl space-y-2 text-white"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Share className="w-4 h-4 text-amber-400" /> Install on iPhone / iPad:
            </p>
            <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-gray-300">
            Tap the <span className="font-bold text-amber-300">Share button</span> in Safari toolbar below, then select <span className="font-bold text-amber-300">&quot;Add to Home Screen&quot;</span> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5" />.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
