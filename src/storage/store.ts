import {
  CounsellorRequest,
  PrivacyPreferences,
  SavedAssessment,
  SavedConversation,
  SavedGameSession,
  StressCategory,
  UserAccount,
} from '../types';
import { habitsStore } from './habitsStore';
import {
  ApiError,
  NetworkError,
  flushOutbox,
  getSession,
  pendingCount,
  queueOp,
  request,
  setSession,
} from './api';

const USERS_KEY = 'ai_wellbeing_users';
const CURRENT_USER_KEY = 'ai_wellbeing_current_user';
const ASSESSMENTS_KEY = 'ai_wellbeing_assessments';
const CONVERSATIONS_KEY = 'ai_wellbeing_conversations';
const GAMES_KEY = 'ai_wellbeing_games';
const COUNSELLOR_KEY = 'ai_wellbeing_counsellor_requests';
const PREFS_KEY = 'ai_wellbeing_prefs';
const CUSTOM_PANDA_KEY = 'ai_wellbeing_custom_panda_image';

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

function load<T>(key: string, defaultValue: T): T {
  try {
    const raw = safeGetItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function save<T>(key: string, data: T): void {
  try {
    safeSetItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Storage save error:', err);
  }
}

// Simple deterministic hash simulation for demo accounts
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'demo_hash_' + Math.abs(hash).toString(16);
}

interface StoredUser extends UserAccount {
  password_hash: string;
}

const DEFAULT_DEMO_USERS: StoredUser[] = [
  {
    id: 'usr_demo_maya',
    email: 'maya@example.com',
    display_name: 'Maya Lin',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    password_hash: hashPassword('password123'),
  },
  {
    id: 'usr_demo_stressina',
    email: 'maya@stressina.ai',
    display_name: 'Maya Lin',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    password_hash: hashPassword('stressina123'),
  },
];

export const store = {
  // --- AUTHENTICATION ---
  getUsers(): StoredUser[] {
    const users = load<StoredUser[]>(USERS_KEY, []);
    if (users.length === 0) {
      save(USERS_KEY, DEFAULT_DEMO_USERS);
      return DEFAULT_DEMO_USERS;
    }
    return users;
  },

  getCurrentUser(): UserAccount | null {
    return load<UserAccount | null>(CURRENT_USER_KEY, null);
  },

  setCurrentUser(user: UserAccount | null): void {
    if (user) {
      save(CURRENT_USER_KEY, user);
    } else {
      safeRemoveItem(CURRENT_USER_KEY);
    }
  },

  // --- BACKEND-AWARE AUTH (falls back to local-only mode if the API is unreachable) ---
  async signIn(email: string, password: string): Promise<{ user: UserAccount | null; error?: string }> {
    try {
      const res = await request<{ token: string; user: UserAccount }>(
        'POST', '/auth/login', { email, password }, null
      );
      setSession({ token: res.token, userId: res.user.id });
      this.setCurrentUser(res.user);
      await this.hydrate();
      habitsStore.migrateGuestData(res.user.id);
      return { user: res.user };
    } catch (err) {
      if (err instanceof ApiError) {
        return { user: null, error: err.status === 429 ? err.message : undefined };
      }
      if (err instanceof NetworkError) {
        // Backend unavailable: keep the app usable with the on-device demo store
        return { user: this.authenticateUser(email, password) };
      }
      throw err;
    }
  },

  async signUp(
    email: string,
    displayName: string,
    password: string
  ): Promise<{ ok: boolean; message: string; user: UserAccount | null }> {
    try {
      const res = await request<{ token: string; user: UserAccount }>(
        'POST', '/auth/register', { email, display_name: displayName, password }, null
      );
      setSession({ token: res.token, userId: res.user.id });
      this.setCurrentUser(res.user);
      await this.hydrate();
      habitsStore.migrateGuestData(res.user.id);
      return { ok: true, message: 'Account created! +50 Welcome Marks awarded.', user: res.user };
    } catch (err) {
      if (err instanceof ApiError) return { ok: false, message: err.message, user: null };
      if (err instanceof NetworkError) return this.registerUser(email, displayName, password);
      throw err;
    }
  },

  async signOut(): Promise<void> {
    const session = getSession();
    if (session) {
      await Promise.race([flushOutbox(), new Promise((r) => setTimeout(r, 2500))]);
      this.clearLocalCache(session.userId); // the server keeps the data; don't leave it on a shared device
      setSession(null);
    }
    this.setCurrentUser(null);
  },

  /** Validate a saved session on app start. Returns the user, or null if signed out / expired. */
  async restoreSession(): Promise<UserAccount | null> {
    const session = getSession();
    if (!session) return this.getCurrentUser();
    try {
      const res = await request<{ user: UserAccount }>('GET', '/auth/me');
      this.setCurrentUser(res.user);
      await this.hydrate();
      return res.user;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setSession(null);
        this.setCurrentUser(null);
        return null;
      }
      return this.getCurrentUser(); // offline: keep working from the on-device copy
    }
  },

  /** Pull the signed-in user's records from the server into the on-device cache. */
  async hydrate(): Promise<boolean> {
    const session = getSession();
    if (!session) return false;
    try {
      await flushOutbox();
      if (pendingCount(session.userId) > 0) return false; // local copy is newer than the server's
      const snap = await request<{
        user: UserAccount;
        preferences: PrivacyPreferences;
        assessments: SavedAssessment[];
        conversations: SavedConversation[];
        game_sessions: SavedGameSession[];
        counsellor_requests: CounsellorRequest[];
        habit_profile: any | null;
      }>('GET', '/sync');
      const uid = session.userId;
      const swap = <T extends { user_id: string }>(key: string, mine: T[]) => {
        const others = load<T[]>(key, []).filter((r) => r.user_id !== uid);
        save(key, [...mine, ...others]);
      };
      swap(ASSESSMENTS_KEY, snap.assessments);
      swap(CONVERSATIONS_KEY, snap.conversations);
      swap(GAMES_KEY, snap.game_sessions);
      swap(COUNSELLOR_KEY, snap.counsellor_requests);
      const allPrefs = load<Record<string, PrivacyPreferences>>(PREFS_KEY, {});
      allPrefs[uid] = snap.preferences;
      save(PREFS_KEY, allPrefs);
      if (snap.habit_profile) habitsStore.setProfileFromServer(uid, snap.habit_profile);
      this.setCurrentUser(snap.user);
      return true;
    } catch {
      return false;
    }
  },

  clearLocalCache(userId: string): void {
    for (const key of [ASSESSMENTS_KEY, CONVERSATIONS_KEY, GAMES_KEY, COUNSELLOR_KEY]) {
      save(key, load<Array<{ user_id: string }>>(key, []).filter((r) => r.user_id !== userId));
    }
    const allPrefs = load<Record<string, PrivacyPreferences>>(PREFS_KEY, {});
    delete allPrefs[userId];
    save(PREFS_KEY, allPrefs);
    habitsStore.clearLocalProfile(userId);
  },

  registerUser(
    email: string,
    displayName: string,
    password: string
  ): { ok: boolean; message: string; user: UserAccount | null } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = displayName.trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { ok: false, message: 'Enter a valid email address.', user: null };
    }
    if (!cleanName || cleanName.length > 80) {
      return { ok: false, message: 'Enter a display name (maximum 80 characters).', user: null };
    }
    if (password.length < 6) {
      return { ok: false, message: 'Use a password with at least 6 characters.', user: null };
    }

    const users = this.getUsers();
    if (users.some((u) => u.email === cleanEmail)) {
      return { ok: false, message: 'An account with that email already exists.', user: null };
    }

    const newUser: StoredUser = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      email: cleanEmail,
      display_name: cleanName,
      created_at: new Date().toISOString(),
      password_hash: hashPassword(password),
    };

    users.push(newUser);
    save(USERS_KEY, users);

    const safeUser: UserAccount = {
      id: newUser.id,
      email: newUser.email,
      display_name: newUser.display_name,
      created_at: newUser.created_at,
    };

    this.setCurrentUser(safeUser);
    // Initialize default preferences
    this.updatePreferences(safeUser.id, {
      save_assessments: true,
      save_chats: true,
      save_games: true,
    });
    // Migrate any guest habits/marks to this new account and grant +50 bonus marks
    habitsStore.migrateGuestData(safeUser.id);

    return { ok: true, message: 'Account created! +50 Welcome Marks awarded.', user: safeUser };
  },

  authenticateUser(email: string, password: string): UserAccount | null {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();
    let user = users.find((u) => u.email === cleanEmail);

    // Fallback demo account alias matching
    if (!user && (cleanEmail === 'maya@example.com' || cleanEmail === 'maya@stressina.ai')) {
      user = DEFAULT_DEMO_USERS[0];
    }

    if (!user) return null;
    
    // For demo users, allow both demo passwords
    if (
      (cleanEmail === 'maya@example.com' || cleanEmail === 'maya@stressina.ai') &&
      (password === 'password123' || password === 'stressina123')
    ) {
      const safeUser: UserAccount = {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        created_at: user.created_at,
      };
      this.setCurrentUser(safeUser);
      habitsStore.migrateGuestData(safeUser.id);
      return safeUser;
    }

    if (user.password_hash !== hashPassword(password)) return null;

    const safeUser: UserAccount = {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      created_at: user.created_at,
    };
    this.setCurrentUser(safeUser);
    // Migrate any guest sessions completed before logging in
    habitsStore.migrateGuestData(safeUser.id);
    return safeUser;
  },

  updateProfile(userId: string, displayName: string): boolean {
    const cleanName = displayName.trim();
    if (!cleanName || cleanName.length > 80) {
      throw new Error('Display name must contain 1–80 characters.');
    }
    // Local-only accounts live in the on-device user list; server accounts do not
    const users = load<StoredUser[]>(USERS_KEY, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users[idx].display_name = cleanName;
      save(USERS_KEY, users);
    }
    const current = this.getCurrentUser();
    const isCurrent = !!current && current.id === userId;
    if (isCurrent) {
      this.setCurrentUser({ ...current!, display_name: cleanName });
    }
    queueOp({ userId, key: 'profile', method: 'PATCH', path: '/profile', body: { display_name: cleanName } });
    return idx >= 0 || isCurrent;
  },

  // --- PREFERENCES ---
  getPreferences(userId: string): PrivacyPreferences {
    const allPrefs = load<Record<string, PrivacyPreferences>>(PREFS_KEY, {});
    return allPrefs[userId] || {
      save_assessments: false,
      save_chats: false,
      save_games: false,
    };
  },

  updatePreferences(userId: string, prefs: PrivacyPreferences): void {
    const allPrefs = load<Record<string, PrivacyPreferences>>(PREFS_KEY, {});
    allPrefs[userId] = prefs;
    save(PREFS_KEY, allPrefs);
    queueOp({ userId, key: 'prefs', method: 'PUT', path: '/preferences', body: prefs });
  },

  // --- ASSESSMENTS ---
  saveAssessment(
    userId: string,
    hrv: number,
    screenTime: number,
    sleep: number,
    stressIndex: number,
    category: StressCategory,
    recommendation: string = ''
  ): SavedAssessment {
    const assessments = load<SavedAssessment[]>(ASSESSMENTS_KEY, []);
    const newAss: SavedAssessment = {
      id: 'ass_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      user_id: userId,
      hrv,
      screen_time: screenTime,
      sleep,
      stress_index: stressIndex,
      category,
      recommendation: recommendation.slice(0, 500),
      created_at: new Date().toISOString(),
    };
    assessments.unshift(newAss);
    save(ASSESSMENTS_KEY, assessments);
    queueOp({ userId, method: 'POST', path: '/assessments', body: newAss });
    return newAss;
  },

  listAssessments(userId: string): SavedAssessment[] {
    const assessments = load<SavedAssessment[]>(ASSESSMENTS_KEY, []);
    return assessments.filter((a) => a.user_id === userId);
  },

  deleteAssessment(userId: string, assessmentId: string): boolean {
    const assessments = load<SavedAssessment[]>(ASSESSMENTS_KEY, []);
    const filtered = assessments.filter((a) => !(a.user_id === userId && a.id === assessmentId));
    save(ASSESSMENTS_KEY, filtered);
    queueOp({ userId, method: 'DELETE', path: `/assessments/${encodeURIComponent(assessmentId)}` });
    return filtered.length < assessments.length;
  },

  // --- CONVERSATIONS ---
  saveConversation(userId: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>): string | null {
    if (!messages || messages.length === 0) return null;
    const conversations = load<SavedConversation[]>(CONVERSATIONS_KEY, []);
    const firstUserMsg = messages.find((m) => m.role === 'user');
    const title = (firstUserMsg?.content || 'Wellbeing chat').slice(0, 70);

    const newConv: SavedConversation = {
      id: 'cnv_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      user_id: userId,
      title,
      created_at: new Date().toISOString(),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content.slice(0, 2000),
        created_at: new Date().toISOString(),
      })),
    };

    conversations.unshift(newConv);
    save(CONVERSATIONS_KEY, conversations);
    queueOp({ userId, method: 'POST', path: '/conversations', body: newConv });
    return newConv.id;
  },

  listConversations(userId: string): SavedConversation[] {
    const conversations = load<SavedConversation[]>(CONVERSATIONS_KEY, []);
    return conversations.filter((c) => c.user_id === userId);
  },

  getConversation(userId: string, conversationId: string): SavedConversation | null {
    const conversations = load<SavedConversation[]>(CONVERSATIONS_KEY, []);
    return conversations.find((c) => c.user_id === userId && c.id === conversationId) || null;
  },

  deleteConversation(userId: string, conversationId: string): boolean {
    const conversations = load<SavedConversation[]>(CONVERSATIONS_KEY, []);
    const filtered = conversations.filter((c) => !(c.user_id === userId && c.id === conversationId));
    save(CONVERSATIONS_KEY, filtered);
    queueOp({ userId, method: 'DELETE', path: `/conversations/${encodeURIComponent(conversationId)}` });
    return filtered.length < conversations.length;
  },

  deleteAllConversations(userId: string): number {
    const conversations = load<SavedConversation[]>(CONVERSATIONS_KEY, []);
    const remaining = conversations.filter((c) => c.user_id !== userId);
    const count = conversations.length - remaining.length;
    save(CONVERSATIONS_KEY, remaining);
    queueOp({ userId, method: 'DELETE', path: '/conversations' });
    return count;
  },

  // --- GAMES & ACTIVITIES ---
  saveGameSession(userId: string, gameName: string, durationSeconds: number = 0, reflection: string = ''): void {
    const sessions = load<SavedGameSession[]>(GAMES_KEY, []);
    const newSession: SavedGameSession = {
      id: 'gam_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      user_id: userId,
      game_name: gameName.slice(0, 80),
      duration_seconds: Math.max(0, durationSeconds),
      reflection: reflection.slice(0, 500),
      created_at: new Date().toISOString(),
    };
    sessions.unshift(newSession);
    save(GAMES_KEY, sessions);
    queueOp({ userId, method: 'POST', path: '/games', body: newSession });
  },

  addGameSession(data: { game_type?: string; game_name?: string; duration_seconds?: number; score?: number; notes?: string }): void {
    const user = this.getCurrentUser();
    const userId = user ? user.id : 'guest';
    const name = data.game_type || data.game_name || 'breathing';
    this.saveGameSession(userId, name, data.duration_seconds || 0, data.notes || '');
  },

  listGameSessions(userId: string): SavedGameSession[] {
    const sessions = load<SavedGameSession[]>(GAMES_KEY, []);
    return sessions.filter((s) => s.user_id === userId);
  },

  // --- COUNSELLOR DEMO REQUESTS ---
  createCounsellorRequest(
    userId: string,
    preferredContact: string,
    preferredTime: string,
    message: string,
    consent: boolean
  ): CounsellorRequest {
    if (!consent) {
      throw new Error('Consent is required.');
    }
    const requests = load<CounsellorRequest[]>(COUNSELLOR_KEY, []);
    const newReq: CounsellorRequest = {
      id: 'req_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      user_id: userId,
      preferred_contact: preferredContact.slice(0, 120),
      preferred_time: preferredTime.slice(0, 120),
      message: message.slice(0, 1000),
      consent: true,
      status: 'Demo request — not sent',
      created_at: new Date().toISOString(),
    };
    requests.unshift(newReq);
    save(COUNSELLOR_KEY, requests);
    queueOp({ userId, method: 'POST', path: '/counsellor-requests', body: newReq });
    return newReq;
  },

  listCounsellorRequests(userId: string): CounsellorRequest[] {
    const requests = load<CounsellorRequest[]>(COUNSELLOR_KEY, []);
    return requests.filter((r) => r.user_id === userId);
  },

  // --- DATA EXPORT & ACCOUNT PURGE ---
  exportPersonalData(userId: string) {
    const user = this.getCurrentUser();
    if (!user || user.id !== userId) return null;

    return {
      profile: {
        email: user.email,
        display_name: user.display_name,
        created_at: user.created_at,
      },
      preferences: this.getPreferences(userId),
      assessments: this.listAssessments(userId),
      conversations: this.listConversations(userId),
      game_sessions: this.listGameSessions(userId),
      counsellor_demo_requests: this.listCounsellorRequests(userId),
      export_note: 'Counsellor requests are local demo records, not sent to a real service.',
      exported_at: new Date().toISOString(),
    };
  },

  async deleteAccount(userId: string): Promise<void> {
    if (getSession()?.userId === userId) {
      // Must succeed on the server first, otherwise the account would silently survive
      await request('DELETE', '/account');
      setSession(null);
    }
    const users = load<StoredUser[]>(USERS_KEY, []).filter((u) => u.id !== userId);
    save(USERS_KEY, users);

    const assessments = load<SavedAssessment[]>(ASSESSMENTS_KEY, []).filter((a) => a.user_id !== userId);
    save(ASSESSMENTS_KEY, assessments);

    const conversations = load<SavedConversation[]>(CONVERSATIONS_KEY, []).filter((c) => c.user_id !== userId);
    save(CONVERSATIONS_KEY, conversations);

    const games = load<SavedGameSession[]>(GAMES_KEY, []).filter((g) => g.user_id !== userId);
    save(GAMES_KEY, games);

    const requests = load<CounsellorRequest[]>(COUNSELLOR_KEY, []).filter((r) => r.user_id !== userId);
    save(COUNSELLOR_KEY, requests);

    const allPrefs = load<Record<string, PrivacyPreferences>>(PREFS_KEY, {});
    delete allPrefs[userId];
    save(PREFS_KEY, allPrefs);

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(null);
    }
  },

  getCustomPandaImage(): string | null {
    const val = safeGetItem(CUSTOM_PANDA_KEY);
    if (!val || val === 'null' || val === 'undefined' || val.trim() === '') return null;
    return val;
  },

  setCustomPandaImage(dataUrl: string | null): void {
    if (dataUrl && dataUrl !== 'null' && dataUrl !== 'undefined' && dataUrl.trim() !== '') {
      safeSetItem(CUSTOM_PANDA_KEY, dataUrl);
    } else {
      safeRemoveItem(CUSTOM_PANDA_KEY);
    }
  },
};
