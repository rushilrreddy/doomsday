"use client";

import React, { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X } from "lucide-react";

interface AllDoneCelebrationProps {
  show: boolean;
  username: string;
  onClose: () => void;
}

export function AllDoneCelebration({ show, username, onClose }: AllDoneCelebrationProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (show && !fired.current) {
      fired.current = true;
      // Burst confetti
      const shoot = (angle: number, origin: number) => {
        confetti({
          angle,
          spread: 60,
          particleCount: 80,
          origin: { x: origin, y: 0.7 },
          colors: ["#22c55e", "#7c5cfc", "#f5c518", "#f0f0f0"],
        });
      };
      setTimeout(() => shoot(120, 0.3), 0);
      setTimeout(() => shoot(60, 0.7), 200);
      setTimeout(() => shoot(90, 0.5), 400);
    }
    if (!show) fired.current = false;
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-3xl p-8 text-center space-y-4"
            style={{ background: "#161616", border: "1px solid #2a2a2a" }}
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl"
            >
              🏆
            </motion.div>

            <div>
              <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>
                All Done!
              </h2>
              <p className="text-sm mt-1" style={{ color: "#888" }}>
                <span className="capitalize font-bold" style={{ color: "#f5c518" }}>{username}</span> crushed every task today 🔥
              </p>
            </div>

            <div className="py-2 px-4 rounded-2xl" style={{ background: "#1c1c1c" }}>
              <p className="text-xs font-semibold" style={{ color: "#555" }}>Streak extended +1 day 🎯</p>
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onClose}
              className="btn-primary w-full text-sm py-3"
            >
              Keep crushing it 💪
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
