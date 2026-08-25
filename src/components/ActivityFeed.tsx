"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ActivityFeedItem, FeedReaction, User } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { CheckSquare, Plus, Share2, Trophy, Flame, MessageSquare, Search, X, Trash2 } from "lucide-react";

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
  items:       ActivityFeedItem[];
  users:       User[];
  reactions:   FeedReaction[];
  currentUser: User;
  onReact:     () => void;
}

const CREW = ["rushil", "alan", "kevin"];

const EMOJIS = ["🔥", "👏", "💀", "😎"] as const;

export function ActivityFeed({ items, users, reactions, currentUser, onReact }: ActivityFeedProps) {
  const [search, setSearch] = useState("");
  const [personFilter, setPersonFilter] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

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
      mine:  itemReactions.some((r) => r.emoji === emoji && r.user_id === currentUser.id),
    }));
  };

  const getUser = (id: string) => users.find((u) => u.id === id);

  const dismiss = (id: string) =>
    setDismissed((prev) => new Set([...prev, id]));

  const clearAll = () =>
    setDismissed(new Set(items.map((i) => i.id)));

  const visibleItems = useMemo(
    () => items.filter((i) => !dismissed.has(i.id)),
    [items, dismissed]
  );

  const filtered = useMemo(() => {
    let base = visibleItems;
    if (personFilter) {
      const u = users.find((u) => u.username.toLowerCase() === personFilter);
      if (u) base = base.filter((item) => item.user_id === u.id);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter((item) => item.content.toLowerCase().includes(q));
    }
    return base;
  }, [visibleItems, search, personFilter, users]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>Activity</h2>
        {visibleItems.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: "#1c1c1c", color: "#555", border: "1px solid #252525" }}
          >
            <Trash2 className="w-3 h-3" />
            Clear all
          </motion.button>
        )}
      </div>

      {/* Person filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
        <button
          onClick={() => setPersonFilter(null)}
          className="flex-shrink-0 pill text-[11px] transition-all"
          style={{
            background: !personFilter ? "#f0f0f0" : "#1c1c1c",
            color: !personFilter ? "#0a0a0a" : "#666",
            border: !personFilter ? "none" : "1px solid #252525",
          }}>
          All
        </button>
        {CREW.map((uname) => {
          const c = USER_COLORS[uname];
          const active = personFilter === uname;
          return (
            <button key={uname} onClick={() => setPersonFilter(active ? null : uname)}
              className="flex-shrink-0 pill text-[11px] capitalize transition-all"
              style={{
                background: active ? `${c}18` : "#1c1c1c",
                color: active ? c : "#666",
                border: active ? `1px solid ${c}30` : "1px solid #252525",
              }}>
              {uname}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#444" }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search activity..."
          className="input-field pl-10 pr-10"
          style={{ borderRadius: 14 }} />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5" style={{ color: "#444" }} />
          </button>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <MessageSquare className="w-6 h-6 mx-auto mb-2" style={{ color: "#333" }} />
            <p className="text-sm" style={{ color: "#444" }}>
              {dismissed.size > 0 && !search && !personFilter
                ? "All cleared."
                : search || personFilter
                ? "No matching activity."
                : "No activity yet today."}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => {
              const u = getUser(item.user_id);
              const color = USER_COLORS[u?.username?.toLowerCase() || ""] || "#666";
              const icon = TYPE_ICONS[item.type] || <MessageSquare className="w-3.5 h-3.5" />;
              return (
                <motion.div key={item.id} layout
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: i < 8 ? i * 0.03 : 0 }}
                  className="flex items-start gap-3 px-4 py-3.5 rounded-2xl group"
                  style={{ background: "#161616", border: "1px solid #1e1e1e" }}>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${color}15`, color }}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug" style={{ color: "#d0d0d0" }}>
                      {item.content}
                    </p>
                    {/* Reactions */}
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {getReactionCounts(item.id).map(({ emoji, count, mine }) => (
                        <motion.button key={emoji} whileTap={{ scale: 0.8 }}
                          onClick={() => toggleReaction(item.id, emoji)}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all"
                          style={{
                            background: mine ? `${color}18` : "#1c1c1c",
                            border:     mine ? `1px solid ${color}30` : "1px solid #252525",
                            color:      count > 0 ? (mine ? color : "#888") : "#383838",
                          }}>
                          {emoji}{count > 0 && <span className="ml-0.5">{count}</span>}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    <span className="text-[10px]" style={{ color: "#444" }}>
                      {relativeTime(item.created_at)}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => dismiss(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-lg flex items-center justify-center"
                      style={{ background: "#252525", color: "#555" }}
                      title="Dismiss"
                    >
                      <X className="w-3 h-3" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
