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
import { GymCheckinCard } from "@/components/GymCheckinCard";
import { StreakCalendar } from "@/components/StreakCalendar";
import { RoutineManager } from "@/components/RoutineManager";
import { BodyWeightTracker } from "@/components/BodyWeightTracker";
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
import { Loader2, CheckSquare, Repeat2, Settings, Shield, LogOut } from "lucide-react";

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("countdown");
  const [executionSubTab, setExecutionSubTab] = useState<"tasks" | "routines">("tasks");
  const [showAdmin, setShowAdmin] = useState(false);

  // Core data
  const [users, setUsers] = useState<User[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);

  // Feature data
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
    } catch {
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
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
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);
  useEffect(() => { if (currentUser) loadData(); }, [currentUser, loadData]);

  useEffect(() => {
    if (!currentUser) return;
    const tables = [
      "users", "tasks", "activity_feed", "streaks", "goals", "notes",
      "daily_checkins", "routines", "routine_logs", "body_weight_logs",
      "study_logs", "feed_reactions", "challenges", "streak_freeze_logs"
    ];
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

  const activeGoal = goals.find((g) => g.status === "active") || null;
  const userXP = useMemo(
    () => (currentUser ? calculateUserXP(currentUser.id, tasks, studyLogs, streaks, goals, weightLogs) : null),
    [currentUser, tasks, studyLogs, streaks, goals, weightLogs]
  );

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const hasCheckedInToday = useMemo(() => {
    if (!currentUser) return false;
    return checkins.some((c) => c.user_id === currentUser.id && c.checkin_date === todayStr);
  }, [checkins, currentUser, todayStr]);

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!currentUser) return <LoginModal onLoginSuccess={checkSession} />;

  const isLeader = currentUser.username.toLowerCase() === "rushil" || currentUser.role === "leader";

  return (
    <div className="min-h-dvh" style={{ background: "#0a0a0a" }}>
      <OfflineBanner />
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        level={userXP?.level}
        onOpenAdmin={() => setShowAdmin(true)}
        onLogout={handleLogout}
      />

      <main className="max-w-md mx-auto px-4 pt-3.5 pb-safe">
        <AnimatePresence mode="wait">

          {/* ── 1. HOME TAB ── */}
          {activeTab === "countdown" && (
            <motion.div
              key="countdown"
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Check-in reminder — only after 7:00 PM if not checked in today */}
              <CheckinReminder
                onGoToCheckin={() => {
                  document.getElementById("daily-checkin-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                hasCheckedInToday={hasCheckedInToday}
              />

              {/* Hero Live Countdown Clock */}
              <GoalSection goals={goals} tasks={tasks} currentUser={currentUser} onRefresh={loadData} />

              {/* XP Level & Streak Freeze Card */}
              <XPLevelCard
                currentUser={currentUser}
                tasks={tasks}
                studyLogs={studyLogs}
                streaks={streaks}
                goals={goals}
                weightLogs={weightLogs}
                onRefresh={loadData}
              />

              {/* Today's Summary Circular Gauges */}
              <TodaySummary users={users} tasks={tasks} currentUser={currentUser} />

              {/* Dedicated Gym / Workout Check-in (+20 XP) */}
              <GymCheckinCard
                logs={weightLogs}
                users={users}
                currentUser={currentUser}
                onRefresh={loadData}
              />

              {/* Daily Check-in submission & list */}
              <div id="daily-checkin-section">
                <DailyCheckinPanel
                  checkins={checkins}
                  users={users}
                  currentUser={currentUser}
                  activeGoal={activeGoal}
                  onRefresh={loadData}
                />
              </div>

              {/* Real-time Activity Feed */}
              <ActivityFeed
                items={feed}
                users={users}
                reactions={reactions}
                currentUser={currentUser}
                onReact={loadData}
              />
            </motion.div>
          )}

          {/* ── 2. EXECUTION TAB (Tasks & Habit Routines) ── */}
          {activeTab === "tasks" && (
            <motion.div
              key="tasks"
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Sub-tab segmented switch */}
              <div className="flex p-1 rounded-2xl bg-white/[0.04] border border-white/10">
                <button
                  type="button"
                  onClick={() => setExecutionSubTab("tasks")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: executionSubTab === "tasks" ? "rgba(255, 255, 255, 0.12)" : "transparent",
                    color: executionSubTab === "tasks" ? "#ffffff" : "#777",
                  }}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Daily Tasks
                </button>
                <button
                  type="button"
                  onClick={() => setExecutionSubTab("routines")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: executionSubTab === "routines" ? "rgba(255, 255, 255, 0.12)" : "transparent",
                    color: executionSubTab === "routines" ? "#ffffff" : "#777",
                  }}
                >
                  <Repeat2 className="w-3.5 h-3.5" />
                  Habit Routines
                </button>
              </div>

              {/* Sub-tab views */}
              {executionSubTab === "tasks" ? (
                <TaskManager
                  tasks={tasks}
                  users={users}
                  currentUser={currentUser}
                  onRefresh={loadData}
                />
              ) : (
                <RoutineManager
                  routines={routines}
                  routineLogs={routineLogs}
                  users={users}
                  currentUser={currentUser}
                  activeGoal={activeGoal}
                  onRefresh={loadData}
                />
              )}
            </motion.div>
          )}

          {/* ── 3. STUDY & DSA TAB ── */}
          {activeTab === "study" && (
            <motion.div
              key="study"
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <StudyTracker
                logs={studyLogs}
                users={users}
                currentUser={currentUser}
                onRefresh={loadData}
              />
              <StudyHeatmap
                logs={studyLogs}
                users={users}
                currentUser={currentUser}
              />
            </motion.div>
          )}

          {/* ── 4. ANALYTICS & STANDINGS TAB ── */}
          {activeTab === "stats" && (
            <motion.div
              key="stats"
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <Leaderboard users={users} tasks={tasks} streaks={streaks} />
              <StreakDisplay streaks={streaks} users={users} currentUser={currentUser} />

              {/* Monthly Streaks Calendar with Fire Symbols */}
              <StreakCalendar
                users={users}
                tasks={tasks}
                routineLogs={routineLogs}
                checkins={checkins}
                studyLogs={studyLogs}
                weightLogs={weightLogs}
                streaks={streaks}
                currentUser={currentUser}
              />

              <WeeklyProgress users={users} tasks={tasks} />
              <ChallengesPanel
                challenges={challenges}
                tasks={tasks}
                studyLogs={studyLogs}
                users={users}
                currentUser={currentUser}
                onRefresh={loadData}
              />
              <CrewRankHistory users={users} tasks={tasks} studyLogs={studyLogs} />
              <RecordsLeaderboard
                users={users}
                tasks={tasks}
                studyLogs={studyLogs}
                streaks={streaks}
                goals={goals}
              />
              <AnalyticsDashboard
                currentUser={currentUser}
                users={users}
                tasks={tasks}
                studyLogs={studyLogs}
              />
              <AchievementsPanel
                tasks={tasks}
                studyLogs={studyLogs}
                goals={goals}
                streaks={streaks}
                currentUser={currentUser}
              />
              <WeeklyReport />
            </motion.div>
          )}

          {/* ── 5. SETTINGS & NOTES TAB ── */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* App & Notification Settings */}
              <ReminderSettings />

              {/* Web Push Subscriptions */}
              <PushNotifications />

              {/* Shared Pinned Crew Notes */}
              <NotesSection notes={notes} users={users} currentUser={currentUser} onRefresh={loadData} />

              {/* Body Weight / Fitness Logging */}
              <BodyWeightTracker
                logs={weightLogs}
                users={users}
                currentUser={currentUser}
                onRefresh={loadData}
              />

              {/* Data Export (CSV) */}
              <DataExport
                tasks={tasks}
                studyLogs={studyLogs}
                checkins={checkins}
                currentUser={currentUser}
              />

              {/* Leader Admin Tools */}
              {isLeader && (
                <div className="card p-4 space-y-3 border border-emerald-500/25 bg-emerald-950/10">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-sm font-bold text-white">Leader Admin Console</p>
                      <p className="text-[10px] text-gray-400">Manage member accounts and reset PINs</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdmin(true)}
                    className="btn-secondary w-full py-2.5 text-xs font-bold text-emerald-300"
                  >
                    Open Member Controls
                  </button>
                </div>
              )}

              {/* Sign out */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-red-400 hover:text-red-300 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out of Countdown Crew
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Admin Panel Modal for Rushil */}
      <LeaderAdminPanel
        isOpen={showAdmin}
        currentUser={currentUser}
        onClose={() => setShowAdmin(false)}
        onRefreshUsers={loadData}
      />

      {/* PWA Install Prompt for iOS/Android */}
      <PWAInstallPrompt />
    </div>
  );
}
