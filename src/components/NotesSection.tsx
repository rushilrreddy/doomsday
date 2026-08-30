"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Note, User } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Lock, Share2, Plus, Trash2, Edit2, BookOpen, Search, X, Pin } from "lucide-react";

interface NotesSectionProps {
  notes: Note[];
  users: User[];
  currentUser: User;
  onRefresh: () => void;
}

const USER_COLORS: Record<string, string> = {
  rushil: "#22c55e",
  pruthvi: "#7c5cfc",
  kevin: "#f5c518",
};

// Minimal markdown renderer (bold, italic, bullets, headings)
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Heading
    if (line.startsWith("## ")) {
      return <p key={i} className="font-black text-sm mt-2" style={{ color: "#f0f0f0" }}>{line.slice(3)}</p>;
    }
    if (line.startsWith("# ")) {
      return <p key={i} className="font-black text-base mt-2" style={{ color: "#f0f0f0" }}>{line.slice(2)}</p>;
    }
    // Bullet
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <div key={i} className="flex items-start gap-2 my-0.5">
          <span style={{ color: "#555" }}>•</span>
          <span className="text-sm" style={{ color: "#c0c0c0" }}>{formatInline(line.slice(2))}</span>
        </div>
      );
    }
    // Empty line
    if (line.trim() === "") return <div key={i} className="h-2" />;
    // Normal line
    return <p key={i} className="text-sm leading-relaxed" style={{ color: "#c0c0c0" }}>{formatInline(line)}</p>;
  });
}

function formatInline(text: string): React.ReactNode {
  // Bold **text** and italic *text*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "#f0f0f0" }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i} style={{ color: "#aaa" }}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export function NotesSection({ notes, users, currentUser, onRefresh }: NotesSectionProps) {
  const [filter, setFilter] = useState<"shared" | "mine">("shared");
  const [content, setContent] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(false);

  const getUser = (id: string) => users.find((u) => u.id === id);

  const filtered = useMemo(() => {
    const base = filter === "shared"
      ? notes.filter((n) => n.is_shared)
      : notes.filter((n) => n.user_id === currentUser.id);
    const searched = !search.trim() ? base : base.filter((n) =>
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      (getUser(n.user_id)?.username || "").toLowerCase().includes(search.toLowerCase())
    );
    // pinned notes always float to top
    return [...searched].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return  1;
      return 0;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, notes, currentUser.id, search]);

  const sharedCount = notes.filter((n) => n.is_shared).length;
  const mineCount = notes.filter((n) => n.user_id === currentUser.id).length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await supabase.from("notes").insert([{
      user_id: currentUser.id, content: content.trim(), is_shared: isShared,
    }]);
    if (isShared) {
      await supabase.from("activity_feed").insert([{
        user_id: currentUser.id, type: "note_shared",
        content: `${currentUser.username} shared a note with the crew 📓`,
      }]);
    }
    setContent(""); setIsShared(false); setPreview(false); onRefresh();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    onRefresh();
  };

  const handlePin = async (id: string, currentPin: boolean) => {
    await supabase.from("notes").update({ is_pinned: !currentPin }).eq("id", id);
    onRefresh();
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    await supabase.from("notes").update({ content: editContent.trim(), updated_at: new Date().toISOString() }).eq("id", id);
    setEditId(null); onRefresh();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black" style={{ color: "#f0f0f0" }}>Notes</h2>
        <p className="text-xs mt-0.5" style={{ color: "#555" }}>Supports **bold**, *italic*, # headings, - bullets</p>
      </div>

      {/* Write note */}
      <form onSubmit={handleSave} className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: "#666" }}>New Note</p>
          <button type="button" onClick={() => setPreview(!preview)}
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all"
            style={{
              background: preview ? "#1c1c1c" : "transparent",
              color: preview ? "#f0f0f0" : "#555",
            }}>
            {preview ? "Edit" : "Preview"}
          </button>
        </div>

        {preview ? (
          <div className="min-h-[80px] px-1 space-y-1">
            {content ? renderMarkdown(content) : (
              <p className="text-xs" style={{ color: "#444" }}>Nothing to preview yet...</p>
            )}
          </div>
        ) : (
          <textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)}
            placeholder={"# Heading\n**bold**, *italic*, - bullets supported"}
            className="input-field" style={{ resize: "none", width: "100%", fontFamily: "monospace", fontSize: 12 }} />
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div onClick={() => setIsShared(!isShared)}
              className="w-9 h-5 rounded-full relative cursor-pointer"
              style={{ background: isShared ? "#7c5cfc" : "#2a2a2a" }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: isShared ? "calc(100% - 18px)" : "2px" }} />
            </div>
            <span className="text-xs font-semibold flex items-center gap-1.5"
              style={{ color: isShared ? "#f0f0f0" : "#555" }}>
              {isShared ? <Share2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isShared ? "Share with crew" : "Keep private"}
            </span>
          </label>
          <motion.button whileTap={{ scale: 0.95 }} type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: "#1c1c1c", border: "1px solid #2a2a2a", color: "#f0f0f0" }}>
            <Plus className="w-3.5 h-3.5" /> Save
          </motion.button>
        </div>
      </form>

      {/* Filter + Search */}
      <div className="space-y-2">
        <div className="flex gap-1.5 p-1 rounded-2xl" style={{ background: "#111" }}>
          {[
            { id: "shared", label: `Group (${sharedCount})`, icon: Share2 },
            { id: "mine", label: `Mine (${mineCount})`, icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = filter === tab.id;
            return (
              <button key={tab.id} onClick={() => setFilter(tab.id as "shared" | "mine")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
                style={{
                  background: active ? "#1c1c1c" : "transparent",
                  color: active ? "#f0f0f0" : "#555",
                  border: active ? "1px solid #252525" : "1px solid transparent",
                }}>
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#444" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="input-field pl-10 pr-10"
            style={{ borderRadius: 14 }} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5" style={{ color: "#444" }} />
            </button>
          )}
        </div>

        {search && (
          <p className="text-xs" style={{ color: "#555" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
          </p>
        )}
      </div>

      {/* Notes list */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <BookOpen className="w-6 h-6 mx-auto mb-2" style={{ color: "#333" }} />
            <p className="text-sm" style={{ color: "#444" }}>
              {search ? "No notes match your search." : filter === "shared" ? "No shared notes yet." : "No personal notes."}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((note) => {
              const owner = getUser(note.user_id);
              const color = USER_COLORS[owner?.username?.toLowerCase() || ""] || "#666";
              const isOwner = note.user_id === currentUser.id;
              const isEditing = editId === note.id;

              return (
                <motion.div key={note.id} layout initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                  className="card p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black"
                        style={{ background: `${color}18`, color }}>
                        {owner?.username?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs font-bold capitalize" style={{ color: "#888" }}>
                        {owner?.username}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: note.is_shared ? "#1a1440" : "#1a1a1a",
                          color: note.is_shared ? "#7c5cfc" : "#555",
                        }}>
                        {note.is_shared ? "Shared" : "Private"}
                      </span>
                      {note.is_pinned && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "#1a1500", color: "#f5c518" }}>📌 Pinned</span>
                      )}
                    </div>
                    <span className="text-[10px]" style={{ color: "#444" }}>
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4}
                        className="input-field" style={{ resize: "none", width: "100%", fontFamily: "monospace", fontSize: 12 }} />
                      <div className="flex gap-2">
                        <button onClick={() => setEditId(null)} className="btn-secondary text-xs py-2 flex-1">Cancel</button>
                        <button onClick={() => handleUpdate(note.id)} className="btn-primary text-xs py-2 flex-1">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {renderMarkdown(note.content)}
                    </div>
                  )}

                  {isOwner && !isEditing && (
                    <div className="flex gap-2 justify-end pt-1" style={{ borderTop: "1px solid #1a1a1a" }}>
                      {note.is_shared && (
                        <button onClick={() => handlePin(note.id, !!note.is_pinned)}
                          className="btn-ghost p-1.5" title={note.is_pinned ? "Unpin" : "Pin to top"}>
                          <Pin className="w-3.5 h-3.5"
                            style={{ color: note.is_pinned ? "#f5c518" : "#555",
                              fill: note.is_pinned ? "#f5c518" : "none" }} />
                        </button>
                      )}
                      <button onClick={() => { setEditId(note.id); setEditContent(note.content); }} className="btn-ghost p-1.5">
                        <Edit2 className="w-3.5 h-3.5" style={{ color: "#555" }} />
                      </button>
                      <button onClick={() => handleDelete(note.id)} className="btn-ghost p-1.5">
                        <Trash2 className="w-3.5 h-3.5" style={{ color: "#555" }} />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
