"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Goal, Task, Note, Streak, ActivityFeedItem, DailyCheckin, Routine, RoutineLog, BodyWeightLog, StudyLog, FeedReaction, Challenge } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Navigation, TabType } from "@/components/Navigation";
import { GoalSection } from "@/components/GoalSection";
import { TaskManager } from "@/components/TaskManager";
import { StreakDisplay } from "@/components/StreakDisplay";
import { ActivityFeed } from "@/components/ActivityFeed";
import { NotesSection } from "@/components/NotesSection";
import { LeaderAdminPanel } from "@/components/LeaderAdminPanel";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { LoginModal } from "@/components/LoginModal";
import { Leaderboard } from "@/components/Leaderboard";
import { TodaySummary } from "@/components/TodaySummary";
import { WeeklyProgress } from "@/components/WeeklyProgress";
import { ReminderSettings } from "@/components/ReminderSettings";
import { DailyCheckinPanel } from "@/components/DailyCheckinPanel";
import { RoutineManager } from "@/components/RoutineManager";
import { BodyWeightTracker } from "@/components/BodyWeightTracker";
import { StreakCalendar } from "@/components/StreakCalendar";
import { StudyTracker } from "@/components/StudyTracker";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PushNotifications } from "@/components/PushNotifications";
import { StudyHeatmap } from "@/components/StudyHeatmap";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { CheckinReminder } from "@/components/CheckinReminder";
import { DataExport } from "@/components/DataExport";
import { ChallengesPanel } from "@/components/ChallengesPanel";
import { WeeklyReport } from "@/components/WeeklyReport";
import { XPLevelCard, calculateUserXP } from "@/components/XPLevelCard";
import { RecordsLeaderboard } from "@/components/RecordsLeaderboard";
import { CrewRankHistory } from "@/components/CrewRankHistory";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { Loader2, Plus, X } from "lucide-react";

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("countdown");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTaskText, setQuickTaskText] = useState("");

  // Core data
  const [users, setUsers] = useState<User[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);

  // New feature data
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineLogs, setRoutineLogs] = useState<RoutineLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<BodyWeightLog[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [reactions, setReactions] = useState<FeedReaction[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) setCurrentUser((await res.json()).user);
      else setCurrentUser(null);
    } catch { setCurrentUser(null); }
    finally { setAuthLoading(false); }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [u, g, t, n, s, f, ci, r, rl, wl, sl, rx, ch] = await Promise.all([
        supabase.from("users").select("id, username, role, status, created_at"),
        supabase.from("goals").select("*").order("created_at", { ascending: false }),
        supabase.from("tasks").select("*").order("sort_order"),
        supabase.from("notes").select("*").order("created_at", { ascending: false }),
        supabase.from("streaks").select("*"),
        supabase.from("activity_feed").select("*").order("created_at", { ascending: false }).limit(60),
        supabase.from("daily_checkins").select("*").order("checkin_date", { ascending: false }).limit(90),
        supabase.from("routines").select("*").order("created_at"),
        supabase.from("routine_logs").select("*").order("log_date", { ascending: false }).limit(300),
        supabase.from("body_weight_logs").select("*").order("log_date", { ascending: false }).limit(90),
        supabase.from("study_logs").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("feed_reactions").select("*"),
        supabase.from("challenges").select("*").order("created_at", { ascending: false }),
      ]);
      if (u.data)  setUsers(u.data as User[]);
      if (g.data)  setGoals(g.data as Goal[]);
      if (t.data)  setTasks(t.data as Task[]);
      if (n.data)  setNotes(n.data as Note[]);
      if (s.data)  setStreaks(s.data as Streak[]);
      if (f.data)  setFeed(f.data as ActivityFeedItem[]);
      if (ci.data) setCheckins(ci.data as DailyCheckin[]);
      if (r.data)  setRoutines(r.data as Routine[]);
      if (rl.data) setRoutineLogs(rl.data as RoutineLog[]);
      if (wl.data) setWeightLogs(wl.data as BodyWeightLog[]);
      if (sl.data) setStudyLogs(sl.data as StudyLog[]);
      if (rx.data) setReactions(rx.data as FeedReaction[]);
      if (ch.data) setChallenges(ch.data as Challenge[]);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);
  useEffect(() => { if (currentUser) loadData(); }, [currentUser, loadData]);

  useEffect(() => {
    if (!currentUser) return;
    const tables = ["users", "tasks", "activity_feed", "streaks", "goals", "notes", "daily_checkins", "routines", "routine_logs", "body_weight_logs", "study_logs", "feed_reactions", "challenges", "streak_freeze_logs"];
    const ch = supabase.channel("page-refresh");
    tables.forEach((table) => {
      ch.on("postgres_changes", { event: "*", schema: "public", table }, () => loadData());
    });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [currentUser, loadData]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskText.trim() || !currentUser) return;
    const todayStr = new Date().toISOString().split("T")[0];
    await supabase.from("tasks").insert([{
      user_id: currentUser.id, title: quickTaskText.trim(),
      is_done: false, task_date: todayStr, sort_order: 999,
    }]);
    await supabase.from("activity_feed").insert([{
      user_id: currentUser.id, type: "task_created",
      content: `${currentUser.username} added: "${quickTaskText.trim()}"`,
    }]);
    setQuickTaskText(""); setShowQuickAdd(false); loadData();
  };

  const activeGoal = goals.find((g) => g.status === "active") || null;
  const userXP = useMemo(
    () => (currentUser ? calculateUserXP(currentUser.id, tasks, studyLogs, streaks, goals) : null),
    [currentUser, tasks, studyLogs, streaks, goals]
  );

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#333" }} />
      </div>
    );
  }

  if (!currentUser) return <LoginModal onLoginSuccess={checkSession} />;

  return (
    <div className="min-h-dvh" style={{ background: "#0a0a0a" }}>
      <OfflineBanner />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab}
        currentUser={currentUser} level={userXP?.level}
        onOpenAdmin={() => setShowAdmin(true)} onLogout={handleLogout} />

      <main className="max-w-md mx-auto px-4 pt-4 pb-safe">
        <AnimatePresence mode="wait">

          {/* ── HOME ── */}
          {activeTab === "countdown" && (
            <motion.div key="countdown" variants={PAGE_VARIANTS}
              initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.2 }} className="space-y-4">
              {/* Check-in reminder — only if not checked in today */}
              {!checkins.some(
                (c) => c.user_id === currentUser.id &&
                       c.checkin_date === new Date().toISOString().split("T")[0]
              ) && (
                <CheckinReminder onGoToCheckin={() => {
                  document.getElementById("daily-checkin-section")?.scrollIntoView({ behavior: "smooth" });
                }} />
              )}
              <XPLevelCard
                currentUser={currentUser}
                tasks={tasks}
                studyLogs={studyLogs}
                streaks={streaks}
                goals={goals}
                onRefresh={loadData}
              />
              <TodaySummary users={users} tasks={tasks} currentUser={currentUser} />
              <GoalSection goals={goals} tasks={tasks} currentUser={currentUser} onRefresh={loadData} />
              <Leaderboard users={users} tasks={tasks} streaks={streaks} />
              <StreakDisplay streaks={streaks} users={users} currentUser={currentUser} />
              <WeeklyProgress users={users} tasks={tasks} />
              <CrewRankHistory users={users} tasks={tasks} studyLogs={studyLogs} />
              <RecordsLeaderboard
                users={users}
                tasks={tasks}
                studyLogs={studyLogs}
                streaks={streaks}
                goals={goals}
              />
              <div id="daily-checkin-section">
                <DailyCheckinPanel checkins={checkins} users={users}
                  currentUser={currentUser} activeGoal={activeGoal} onRefresh={loadData} />
              </div>
              <ActivityFeed items={feed} users={users}
                reactions={reactions} currentUser={currentUser}
                onReact={loadData} />
              <AchievementsPanel
                tasks={tasks}
                studyLogs={studyLogs}
                goals={goals}
                streaks={streaks}
                currentUser={currentUser}
              />
            </motion.div>
          )}

          {/* ── TASKS ── */}
          {activeTab === "tasks" && (
            <motion.div key="tasks" variants={PAGE_VARIANTS}
              initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
              <TaskManager tasks={tasks} users={users} currentUser={currentUser} onRefresh={loadData} />
            </motion.div>
          )}

          {/* ── STUDY ── */}
          {activeTab === "study" && (
            <motion.div key="study" variants={PAGE_VARIANTS}
              initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
              <StudyTracker
                logs={studyLogs} users={users} currentUser={currentUser}
                onRefresh={loadData}
              />
              <div className="mt-4">
                <ChallengesPanel
                  challenges={challenges}
                  tasks={tasks}
                  studyLogs={studyLogs}
                  users={users}
                  currentUser={currentUser}
                  onRefresh={loadData}
                />
              </div>
            </motion.div>
          )}

          {/* ── ROUTINES ── */}
          {activeTab === "routines" && (
            <motion.div key="routines" variants={PAGE_VARIANTS}
              initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
              <RoutineManager
                routines={routines}
                routineLogs={routineLogs}
                users={users}
                currentUser={currentUser}
                activeGoal={activeGoal}
                onRefresh={loadData}
              />
            </motion.div>
          )}

          {/* ── STATS ── */}
          {activeTab === "stats" && (
            <motion.div key="stats" variants={PAGE_VARIANTS}
              initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.2 }} className="space-y-6">
              <StreakCalendar
                users={users}
                tasks={tasks}
                routineLogs={routineLogs}
                checkins={checkins}
                studyLogs={studyLogs}
                streaks={streaks}
                currentUser={currentUser}
              />
              <StudyHeatmap
                logs={studyLogs}
                users={users}
                currentUser={currentUser}
              />
              <AnalyticsDashboard
                currentUser={currentUser}
                users={users}
                tasks={tasks}
                studyLogs={studyLogs}
              />
              <BodyWeightTracker
                logs={weightLogs}
                users={users}
                currentUser={currentUser}
                onRefresh={loadData}
              />
              <PushNotifications />
              <WeeklyReport />
              <DataExport
                tasks={tasks}
                studyLogs={studyLogs}
                checkins={checkins}
                currentUser={currentUser}
              />
              <ReminderSettings />
            </motion.div>
          )}

          {/* ── NOTES ── */}
          {activeTab === "notes" && (
            <motion.div key="notes" variants={PAGE_VARIANTS}
              initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
              <NotesSection notes={notes} users={users} currentUser={currentUser} onRefresh={loadData} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Quick-Add FAB */}
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowQuickAdd(true)}
        className="fixed z-40 flex items-center justify-center rounded-full shadow-float"
        style={{
          bottom: "calc(70px + env(safe-area-inset-bottom, 0px))",
          right: 18, width: 46, height: 46, background: "#f0f0f0",
        }}>
        <Plus className="w-5 h-5" style={{ color: "#0a0a0a" }} />
      </motion.button>

      {/* Quick Add Sheet */}
      <AnimatePresence>
        {showQuickAdd && (
          <div className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowQuickAdd(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 38 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-5 rounded-t-3xl space-y-3"
              style={{ background: "#161616", border: "1px solid #252525", borderBottom: "none",
                paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-sm" style={{ color: "#f0f0f0" }}>Quick Add Task</p>
                <button onClick={() => setShowQuickAdd(false)}>
                  <X className="w-4 h-4" style={{ color: "#555" }} />
                </button>
              </div>
              <form onSubmit={handleQuickAdd} className="flex gap-2">
                <input autoFocus value={quickTaskText}
                  onChange={(e) => setQuickTaskText(e.target.value)}
                  placeholder="What do you need to do today?" className="input-field flex-1" />
                <motion.button whileTap={{ scale: 0.92 }} type="submit"
                  className="px-4 rounded-xl text-sm font-bold"
                  style={{ background: "#f0f0f0", color: "#0a0a0a" }}>
                  Add
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {currentUser.role === "leader" && (
        <LeaderAdminPanel isOpen={showAdmin} onClose={() => setShowAdmin(false)}
          currentUser={currentUser} onRefreshUsers={loadData} />
      )}

      <PWAInstallPrompt />
    </div>
  );
}
