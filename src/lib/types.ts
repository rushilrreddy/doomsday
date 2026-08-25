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
  | 'study_logged'
  | 'weekly_report';

export interface FeedReaction {
  id:           string;
  feed_item_id: string;
  user_id:      string;
  emoji:        string;
  created_at:   string;
}

export interface Challenge {
  id:         string;
  title:      string;
  metric:     'dsa_problems' | 'study_minutes' | 'tasks_done';
  start_date: string; // YYYY-MM-DD
  end_date:   string; // YYYY-MM-DD
  created_by: string;
  status:     'active' | 'ended';
  winner_id:  string | null;
  created_at: string;
}

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
  note?: string | null;
  mood?: string | null;
  energy_level?: string | null;
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
  id:         string;
  title:      string;
  description:string | null;
  start_date: string | null;
  target_date:string;
  stake:      string;
  status:     GoalStatus;
  winner_id:  string | null;
  created_by: string;
  created_at: string;
  proof_url:  string | null;
  proof_note: string | null;
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
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}


export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  freeze_tokens?: number;
  frozen_dates?: string[];
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
