import { DailyQuestLog, StressHabit, UserHabitProfile } from '../types';

const HABITS_PROFILE_KEY = 'stressina_habit_profile_';
const GUEST_KEY = 'guest';

export const DEFAULT_HABITS: StressHabit[] = [
  {
    id: 'habit_read_book',
    title: 'Read a Book (30 mins)',
    category: 'mind',
    marks: 25,
    durationMinutes: 30,
    iconName: 'book',
    description: 'Immerse in 30 minutes of screen-free reading to decelerate mental chatter and soothe cognitive strain.',
  },
  {
    id: 'habit_gym_workout',
    title: 'Gym Workout & Strength',
    category: 'body',
    marks: 30,
    durationMinutes: 45,
    iconName: 'dumbbell',
    description: 'Break a sweat with resistance training or cardio to burn off cortisol and stimulate endorphin flow.',
  },
  {
    id: 'habit_yoga_stretch',
    title: 'Yoga & Mindful Stretching',
    category: 'body',
    marks: 25,
    durationMinutes: 20,
    iconName: 'sparkles',
    description: 'Gentle somatic postures and spinal release to stimulate the vagus nerve and loosen muscular tightness.',
  },
  {
    id: 'habit_cooking',
    title: 'Cooking a Nourishing Meal',
    category: 'activity',
    marks: 20,
    durationMinutes: 30,
    iconName: 'utensils',
    description: 'Engage tactile and olfactory senses in the kitchen. Mindfully chop, simmer, and enjoy wholesome food.',
  },
  {
    id: 'habit_gardening',
    title: 'Gardening & Nature Care',
    category: 'activity',
    marks: 20,
    durationMinutes: 20,
    iconName: 'sprout',
    description: 'Touch natural soil, prune foliage, water flora, and breathe fresh outdoor air for grounding biophilia.',
  },
  {
    id: 'habit_breathing',
    title: 'Guided Deep Breathing (5 mins)',
    category: 'mind',
    marks: 15,
    durationMinutes: 5,
    iconName: 'wind',
    description: 'Practice Box Breathing or 4-7-8 relaxing cycles inside the stressina.AI Relax Sanctuary.',
  },
  {
    id: 'habit_stress_crush',
    title: 'Play Stress Crush Game (10 mins)',
    category: 'activity',
    marks: 20,
    durationMinutes: 10,
    iconName: 'sparkles',
    description: 'Clear stress and mental tension with the colorful, mindful Stress Crush match-3 mini-game.',
  },
  {
    id: 'habit_digital_sunset',
    title: 'Digital Sunset (No Screens 1 hr Before Sleep)',
    category: 'lifestyle',
    marks: 25,
    durationMinutes: 60,
    iconName: 'moon',
    description: 'Power down phones, laptops, and tablets 60 minutes before bed to allow natural melatonin restoration.',
  },
  {
    id: 'habit_mindful_hydration',
    title: 'Mindful Hydration & Pause',
    category: 'lifestyle',
    marks: 15,
    durationMinutes: 10,
    iconName: 'heart',
    description: 'Drink a glass of water slowly, feeling each sip, followed by three conscious abdominal breaths.',
  },
];

export function getLevelInfo(totalMarks: number): { level: number; title: string; nextLevelAt: number; progress: number } {
  if (totalMarks < 100) {
    return {
      level: 1,
      title: 'Zen Seeker',
      nextLevelAt: 100,
      progress: Math.min(100, Math.round((totalMarks / 100) * 100)),
    };
  }
  if (totalMarks < 250) {
    return {
      level: 2,
      title: 'Calm Explorer',
      nextLevelAt: 250,
      progress: Math.min(100, Math.round(((totalMarks - 100) / 150) * 100)),
    };
  }
  if (totalMarks < 500) {
    return {
      level: 3,
      title: 'Mindfulness Pioneer',
      nextLevelAt: 500,
      progress: Math.min(100, Math.round(((totalMarks - 250) / 250) * 100)),
    };
  }
  if (totalMarks < 900) {
    return {
      level: 4,
      title: 'Harmony Master',
      nextLevelAt: 900,
      progress: Math.min(100, Math.round(((totalMarks - 500) / 400) * 100)),
    };
  }
  return {
    level: 5,
    title: 'Serenity Sage',
    nextLevelAt: 1500,
    progress: Math.min(100, Math.round(((totalMarks - 900) / 600) * 100)),
  };
}

export function getTodayKey(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function getYesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

const memStorage = new Map<string, string>();

function safeGetItem(key: string): string | null {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memStorage.get(key) || null;
    }
  }
  return memStorage.get(key) || null;
}

function safeSetItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {
      // fallback
    }
  }
  memStorage.set(key, value);
}

function safeRemoveItem(key: string): void {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }
  memStorage.delete(key);
}

export const habitsStore = {
  getProfileKey(userId?: string | null): string {
    return HABITS_PROFILE_KEY + (userId || GUEST_KEY);
  },

  getProfile(userId?: string | null): UserHabitProfile {
    const key = this.getProfileKey(userId);
    try {
      const raw = safeGetItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed;
      }
    } catch {
      // fallback
    }

    // Default starting profile
    const defaultProfile: UserHabitProfile = {
      totalMarks: 0,
      currentStreak: 0,
      lastActiveDate: '',
      level: 1,
      levelTitle: 'Zen Seeker',
      customHabits: [],
      completedDates: {},
    };
    return defaultProfile;
  },

  saveProfile(profile: UserHabitProfile, userId?: string | null): void {
    const key = this.getProfileKey(userId);
    try {
      const levelInfo = getLevelInfo(profile.totalMarks);
      profile.level = levelInfo.level;
      profile.levelTitle = levelInfo.title;
      safeSetItem(key, JSON.stringify(profile));
    } catch (err) {
      console.error('Failed to save habit profile:', err);
    }
  },

  // Migrate guest data into newly registered or signed-in user
  migrateGuestData(userId: string): void {
    const guestKey = this.getProfileKey(null);
    try {
      const guestRaw = safeGetItem(guestKey);
      if (!guestRaw) return;
      const guestData = JSON.parse(guestRaw) as UserHabitProfile;
      const userProfile = this.getProfile(userId);

      // Merge points and completed dates
      userProfile.totalMarks = Math.max(userProfile.totalMarks, guestData.totalMarks) + 50; // +50 bonus marks for registering!
      userProfile.currentStreak = Math.max(userProfile.currentStreak, guestData.currentStreak, 1);
      userProfile.customHabits = [...userProfile.customHabits, ...(guestData.customHabits || [])];
      userProfile.completedDates = { ...userProfile.completedDates, ...(guestData.completedDates || {}) };

      this.saveProfile(userProfile, userId);
      // clean guest key
      safeRemoveItem(guestKey);
    } catch (err) {
      console.error('Failed to migrate guest habits:', err);
    }
  },

  getAllHabits(userId?: string | null): StressHabit[] {
    const profile = this.getProfile(userId);
    return [...DEFAULT_HABITS, ...(profile.customHabits || [])];
  },

  addCustomHabit(
    habit: Omit<StressHabit, 'id' | 'isCustom'>,
    userId?: string | null
  ): StressHabit {
    const profile = this.getProfile(userId);
    const newHabit: StressHabit = {
      ...habit,
      id: 'custom_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      isCustom: true,
    };
    profile.customHabits = [...(profile.customHabits || []), newHabit];
    this.saveProfile(profile, userId);
    return newHabit;
  },

  deleteCustomHabit(habitId: string, userId?: string | null): void {
    const profile = this.getProfile(userId);
    profile.customHabits = (profile.customHabits || []).filter((h) => h.id !== habitId);
    this.saveProfile(profile, userId);
  },

  getTodayLog(userId?: string | null): DailyQuestLog {
    const profile = this.getProfile(userId);
    const today = getTodayKey();
    if (profile.completedDates[today]) {
      return profile.completedDates[today];
    }
    return {
      date: today,
      completedHabitIds: [],
      dailyMarks: 0,
      bonusMarks: 0,
      updatedAt: new Date().toISOString(),
    };
  },

  toggleHabit(
    habitId: string,
    userId?: string | null
  ): { completed: boolean; marksDelta: number; newTotalMarks: number; newStreak: number; leveledUp: boolean } {
    const profile = this.getProfile(userId);
    const today = getTodayKey();
    const yesterday = getYesterdayKey();
    const allHabits = this.getAllHabits(userId);
    const targetHabit = allHabits.find((h) => h.id === habitId);
    const habitMarks = targetHabit ? targetHabit.marks : 20;

    let todayLog = profile.completedDates[today];
    if (!todayLog) {
      todayLog = {
        date: today,
        completedHabitIds: [],
        dailyMarks: 0,
        bonusMarks: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    const isAlreadyCompleted = todayLog.completedHabitIds.includes(habitId);
    let marksDelta = 0;
    let completed = false;

    if (isAlreadyCompleted) {
      // Untoggle
      todayLog.completedHabitIds = todayLog.completedHabitIds.filter((id) => id !== habitId);
      marksDelta = -habitMarks;
      todayLog.dailyMarks = Math.max(0, todayLog.dailyMarks + marksDelta);
      profile.totalMarks = Math.max(0, profile.totalMarks + marksDelta);
      completed = false;
    } else {
      // Mark as completed
      todayLog.completedHabitIds.push(habitId);
      marksDelta = habitMarks;
      todayLog.dailyMarks += marksDelta;
      profile.totalMarks += marksDelta;
      completed = true;

      // Update Streak
      if (profile.lastActiveDate !== today) {
        if (profile.lastActiveDate === yesterday) {
          profile.currentStreak += 1;
        } else if (profile.lastActiveDate === '') {
          profile.currentStreak = 1;
        } else {
          // missed a day, reset streak to 1
          profile.currentStreak = 1;
        }
        profile.lastActiveDate = today;
      }
    }

    todayLog.updatedAt = new Date().toISOString();
    profile.completedDates[today] = todayLog;

    const oldLevel = profile.level;
    const newLevelInfo = getLevelInfo(profile.totalMarks);
    profile.level = newLevelInfo.level;
    profile.levelTitle = newLevelInfo.title;
    const leveledUp = newLevelInfo.level > oldLevel;

    this.saveProfile(profile, userId);

    return {
      completed,
      marksDelta,
      newTotalMarks: profile.totalMarks,
      newStreak: profile.currentStreak,
      leveledUp,
    };
  },

  addBonusMarks(marks: number, reason: string = 'Welcome Bonus', userId?: string | null): number {
    const profile = this.getProfile(userId);
    profile.totalMarks += marks;
    if (profile.currentStreak === 0) profile.currentStreak = 1;
    this.saveProfile(profile, userId);
    return profile.totalMarks;
  },

  addMarks(marks: number, reason: string = 'Quest Marks', userId?: string | null): number {
    return this.addBonusMarks(marks, reason, userId);
  },
};
