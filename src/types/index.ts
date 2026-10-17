export type StressCategory = 'Low' | 'Medium' | 'High';

export interface UniverseConfig {
  min: number;
  max: number;
  step: number;
  unit: string;
  label: string;
  default: number;
  range: [number, number];
}

export interface RuleFiring {
  rule_id: string;
  doc_id: string;
  rule_type: 'core' | 'supplementary';
  condition_text: string;
  consequent: StressCategory;
  firing_strength: number;
  recommendation_hint: string;
  rationale: string;
  is_active: boolean;
}

export interface InferenceResult {
  inputs: {
    hrv: number;
    screen_time: number;
    sleep_duration: number;
  };
  memberships: {
    hrv: { low: number; normal: number; high: number };
    screen_time: { short: number; moderate: number; prolonged: number };
    sleep_duration: { inadequate: number; marginal: number; optimal: number };
  };
  crisp_stress_index: number;
  rule_evaluations: RuleFiring[];
  active_rules: RuleFiring[];
  aggregated_fuzzy_set: number[];
  stress_universe: number[];
}

export interface CopingRecommendation {
  id: string;
  title: string;
  description: string;
  stress_category: StressCategory[];
  duration: string;
  context: string[];
  reason: string;
  selection_rationale?: string;
}

export interface ExplanationPayload {
  crisp_stress_index: number;
  stress_category: StressCategory;
  inputs: {
    hrv: number;
    screen_time: number;
    sleep_duration: number;
  };
  memberships: {
    hrv: { low: number; normal: number; high: number };
    screen_time: { short: number; moderate: number; prolonged: number };
    sleep_duration: { inadequate: number; marginal: number; optimal: number };
  };
  active_rules: Array<{
    rule_id: string;
    doc_id: string;
    rule_type: string;
    condition: string;
    consequent: string;
    firing_strength: number;
    rationale: string;
  }>;
  stress_drivers: string[];
  recommendation: CopingRecommendation;
  formatted_text: string;
}

export interface UserAccount {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface PrivacyPreferences {
  save_assessments: boolean;
  save_chats: boolean;
  save_games: boolean;
}

export interface SavedAssessment {
  id: string;
  user_id: string;
  hrv: number;
  screen_time: number;
  sleep: number;
  stress_index: number;
  category: StressCategory;
  recommendation: string;
  created_at: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface SavedConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  messages: ChatMessage[];
}

export interface SavedGameSession {
  id: string;
  user_id: string;
  game_name: string;
  duration_seconds: number;
  reflection: string;
  created_at: string;
}

export interface CounsellorRequest {
  id: string;
  user_id: string;
  preferred_contact: string;
  preferred_time: string;
  message: string;
  consent: boolean;
  status: string;
  created_at: string;
}

export interface SyntheticSample {
  hrv_ms: number;
  screen_time_h: number;
  sleep_h: number;
  reference_category: StressCategory;
}

export type HabitCategory = 'mind' | 'body' | 'activity' | 'lifestyle' | 'custom';

export interface StressHabit {
  id: string;
  title: string;
  category: HabitCategory;
  description: string;
  marks: number;
  durationMinutes: number;
  iconName: 'book' | 'dumbbell' | 'sparkles' | 'utensils' | 'sprout' | 'wind' | 'moon' | 'heart' | 'flame' | 'compass';
  isCustom?: boolean;
}

export interface DailyQuestLog {
  date: string; // YYYY-MM-DD
  completedHabitIds: string[];
  dailyMarks: number;
  bonusMarks: number;
  updatedAt: string;
}

export interface UserHabitProfile {
  totalMarks: number;
  currentStreak: number;
  lastActiveDate: string;
  level: number;
  levelTitle: string;
  customHabits: StressHabit[];
  completedDates: Record<string, DailyQuestLog>;
}

