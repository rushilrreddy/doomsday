"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const go = () => setIsOffline(!navigator.onLine);
    window.addEventListener("online",  go);
    window.addEventListener("offline", go);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("online",  go);
      window.removeEventListener("offline", go);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 text-xs font-bold"
          style={{ background: "#f59e0b", color: "#0a0a0a" }}
        >
          <WifiOff className="w-3.5 h-3.5" />
          You&apos;re offline — showing cached data
        </motion.div>
      )}
    </AnimatePresence>
  );
}
