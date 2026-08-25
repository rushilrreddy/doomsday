export type Role = 'leader' | 'member';
export type UserStatus = 'active' | 'inactive';
export type GoalStatus = 'active' | 'achieved' | 'failed';
export type ActivityType = 
  | 'task_done' 
  | 'task_created' 
  | 'note_shared' 
  | 'goal_created' 
  | 'goal_completed' 
  | 'streak_updated'
  | 'checkin_added'
  | 'routine_done'
  | 'weight_logged'
  | 'study_logged';

export interface StudyLog {
  id: string;
  user_id: string;
  category: 'dsa' | 'college' | 'general';
  subject: string;
  topic: string | null;
  problems_solved: number;
  duration_minutes: number;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  platform: string | null;
  notes: string | null;
  is_private: boolean;
  log_date: string;   // "YYYY-MM-DD"
  created_at: string;
}

export interface Routine {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  emoji: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

export interface RoutineLog {
  id: string;
  user_id: string;
  routine_id: string;
  log_date: string;   // "YYYY-MM-DD"
  created_at: string;
}

export interface BodyWeightLog {
  id: string;
  user_id: string;
  weight: number;
  unit: 'kg' | 'lbs';
  note: string | null;
  log_date: string;   // "YYYY-MM-DD"
  created_at: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  goal_id: string | null;
  content: string;
  checkin_date: string;   // "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  username: string;
  role: Role;
  status: UserStatus;
  created_at: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  target_date: string;
  stake: string;
  status: GoalStatus;
  winner_id: string | null;
  created_by: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  is_done: boolean;
  task_date: string;
  sort_order: number;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  content: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
}

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  type: ActivityType;
  content: string;
  created_at: string;
  user?: {
    username: string;
  };
}

export interface SessionPayload {
  userId: string;
  username: string;
  role: Role;
  exp?: number;
}
