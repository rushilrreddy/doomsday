"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ActivityFeedItem, FeedReaction, User } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { CheckSquare, Plus, Share2, Trophy, Flame, Search, X, Trash2, Dumbbell, Sparkles } from "lucide-react";

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  alan: "#7c5cfc",
  kevin: "#f5c518",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  task_done: <CheckSquare className="w-3.5 h-3.5" />,
  task_created: <Plus className="w-3.5 h-3.5" />,
  note_shared: <Share2 className="w-3.5 h-3.5" />,
  goal_created: <Trophy className="w-3.5 h-3.5" />,
  goal_completed: <Trophy className="w-3.5 h-3.5" />,
  streak_updated: <Flame className="w-3.5 h-3.5" />,
  gym_checkin: <Dumbbell className="w-3.5 h-3.5" />,
  routine_done: <Sparkles className="w-3.5 h-3.5" />,
};

function relativeTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return new Date(d).toLocaleDateString();
}

interface ActivityFeedProps {
  items: ActivityFeedItem[];
  users: User[];
  reactions: FeedReaction[];
  currentUser: User;
  onReact: () => void;
}

const CREW = ["rushil", "alan", "kevin"];
const EMOJIS = ["🔥", "👏", "💀", "😎"] as const;

export function ActivityFeed({ items = [], users = [], reactions = [], currentUser, onReact }: ActivityFeedProps) {
  const [search, setSearch] = useState("");
  const [personFilter, setPersonFilter] = useState<string | null>(null);

  // Persistent dismissed IDs in localStorage
  const storageKey = `crew_dismissed_feed_${currentUser?.id || "anon"}`;
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Keep localStorage in sync whenever dismissed changes
  const saveDismissed = (newSet: Set<string>) => {
    setDismissed(newSet);
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));
    } catch (e) {
      console.error(e);
    }
  };

  const isLeader = currentUser?.username?.toLowerCase() === "rushil" || currentUser?.role === "leader";

  const toggleReaction = async (feedItemId: string, emoji: string) => {
    const existing = reactions.find(
      (r) => r.feed_item_id === feedItemId && r.user_id === currentUser.id && r.emoji === emoji
    );
    if (existing) {
      await supabase.from("feed_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("feed_reactions").insert([{ feed_item_id: feedItemId, user_id: currentUser.id, emoji }]);
    }
    onReact();
  };

  const getReactionCounts = (feedItemId: string) => {
    const itemReactions = reactions.filter((r) => r.feed_item_id === feedItemId);
    return EMOJIS.map((emoji) => ({
      emoji,
      count: itemReactions.filter((r) => r.emoji === emoji).length,
      mine: itemReactions.some((r) => r.emoji === emoji && r.user_id === currentUser.id),
    }));
  };

  const getUser = (id: string) => users.find((u) => u.id === id);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    saveDismissed(next);
  };

  const clearAll = () => {
    const next = new Set([...dismissed, ...items.map((i) => i.id)]);
    saveDismissed(next);
  };

  const deletePermanent = async (id: string) => {
    await supabase.from("activity_feed").delete().eq("id", id);
    dismiss(id);
    onReact();
  };

  const visibleItems = useMemo(
    () => (items || []).filter((i) => i && !dismissed.has(i.id)),
    [items, dismissed]
  );

  const filtered = useMemo(() => {
    let base = visibleItems;
    if (personFilter) {
      const u = (users || []).find((u) => u && u.username && u.username.toLowerCase() === personFilter);
      if (u) base = base.filter((item) => item.user_id === u.id);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter((item) => item.content && item.content.toLowerCase().includes(q));
    }
    return base;
  }, [visibleItems, search, personFilter, users]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <h3 className="font-bold text-sm text-white">Live Activity Feed</h3>
          {visibleItems.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-white/10 text-gray-300">
              {visibleItems.length}
            </span>
          )}
        </div>

        {visibleItems.length > 0 && (
          <button
            onClick={clearAll}
            className="text-[11px] font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter chips & Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-8 py-1.5 text-xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex gap-1">
          {CREW.map((uname) => {
            const active = personFilter === uname;
            const uColor = USER_COLORS[uname];
            return (
              <button
                key={uname}
                onClick={() => setPersonFilter(active ? null : uname)}
                className="w-7 h-7 rounded-lg text-xs font-bold transition-all capitalize"
                style={{
                  background: active ? uColor : "rgba(255,255,255,0.05)",
                  color: active ? "#000" : "#888",
                  border: `1px solid ${active ? uColor : "rgba(255,255,255,0.08)"}`,
                }}
                title={`Filter by ${uname}`}
              >
                {uname[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-6 text-center text-xs text-gray-500"
            >
              {dismissed.size > 0 && items.length > 0 ? (
                <div className="space-y-2">
                  <p>All activity notifications cleared.</p>
                  <button
                    onClick={() => saveDismissed(new Set())}
                    className="text-[11px] font-bold text-purple-400 hover:underline"
                  >
                    Restore cleared items
                  </button>
                </div>
              ) : (
                "No recent activity logged yet."
              )}
            </motion.div>
          ) : (
            filtered.map((item) => {
              const author = getUser(item.user_id);
              const color = author ? USER_COLORS[author.username.toLowerCase()] || "#888" : "#888";
              const canDeletePermanent = isLeader || item.user_id === currentUser.id;
              const reactionsCount = getReactionCounts(item.id);

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="card p-3 space-y-2.5 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                        style={{ background: `${color}20`, color }}
                      >
                        {author ? author.username[0].toUpperCase() : "?"}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white capitalize">
                            {author?.username || "Crew Member"}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            • {relativeTime(item.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Permanent delete for leader / owner */}
                      {canDeletePermanent && (
                        <button
                          onClick={() => deletePermanent(item.id)}
                          className="p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Clear / Dismiss from user's view */}
                      <button
                        onClick={() => dismiss(item.id)}
                        className="p-1 rounded-lg text-gray-600 hover:text-gray-300 opacity-60 hover:opacity-100 transition-opacity"
                        title="Dismiss notification"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-xs text-gray-200 pl-9 leading-relaxed break-words">
                    {item.content}
                  </p>

                  {/* Emoji Reactions Bar */}
                  <div className="flex items-center gap-1.5 pl-9 pt-1">
                    {reactionsCount.map(({ emoji, count, mine }) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => toggleReaction(item.id, emoji)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all"
                        style={{
                          background: mine ? "rgba(124, 92, 252, 0.25)" : "rgba(255, 255, 255, 0.04)",
                          border: `1px solid ${mine ? "rgba(124, 92, 252, 0.4)" : "rgba(255, 255, 255, 0.06)"}`,
                          color: mine ? "#c4b5fd" : "#9ca3af",
                        }}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span className="text-[10px] font-bold">{count}</span>}
                      </button>
                    ))}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
