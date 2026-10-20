import { DatabaseSync } from 'node:sqlite'; // built into Node 22.13+ (no native build step)
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.resolve(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const raw = new DatabaseSync(path.join(dataDir, 'stressina.sqlite'));
raw.exec('PRAGMA journal_mode = WAL');
raw.exec('PRAGMA foreign_keys = ON');

/** Tiny wrapper so the rest of the server can use prepare/exec/transaction. */
export const db = {
  prepare: (sql) => raw.prepare(sql),
  exec: (sql) => raw.exec(sql),
  transaction: (fn) => (...args) => {
    raw.exec('BEGIN');
    try {
      const result = fn(...args);
      raw.exec('COMMIT');
      return result;
    } catch (err) {
      raw.exec('ROLLBACK');
      throw err;
    }
  },
};

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS preferences (
  user_id          TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  save_assessments INTEGER NOT NULL DEFAULT 0,
  save_chats       INTEGER NOT NULL DEFAULT 0,
  save_games       INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS assessments (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hrv            REAL NOT NULL,
  screen_time    REAL NOT NULL,
  sleep          REAL NOT NULL,
  stress_index   REAL NOT NULL,
  category       TEXT NOT NULL CHECK (category IN ('Low','Medium','High')),
  recommendation TEXT NOT NULL DEFAULT '',
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_assessments_user ON assessments(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS conversations (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS messages (
  seq             INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content         TEXT NOT NULL,
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, seq);
CREATE TABLE IF NOT EXISTS game_sessions (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_name        TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  reflection       TEXT NOT NULL DEFAULT '',
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_games_user ON game_sessions(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS counsellor_requests (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferred_contact TEXT NOT NULL,
  preferred_time    TEXT NOT NULL,
  message           TEXT NOT NULL,
  consent           INTEGER NOT NULL,
  status            TEXT NOT NULL,
  created_at        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_counsellor_user ON counsellor_requests(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS habit_profiles (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data       TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);

/* ---------- Demo accounts (same credentials the front-end always advertised) ---------- */
function dayKey(offset) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().split('T')[0];
}

export function seedDemoData() {
  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (id, email, display_name, password_hash, created_at) VALUES (?,?,?,?,?)'
  );
  const created = new Date(Date.now() - 7 * 86400000).toISOString();
  const demos = [
    ['usr_demo_maya', 'maya@example.com', 'Maya Lin', 'password123'],
    ['usr_demo_stressina', 'maya@stressina.ai', 'Maya Lin', 'stressina123'],
  ];
  for (const [id, email, name, pwd] of demos) {
    const res = insertUser.run(id, email, name, bcrypt.hashSync(pwd, 10), created);
    if (res.changes === 0) continue; // already seeded, never overwrite a user's data
    db.prepare(
      'INSERT OR IGNORE INTO preferences (user_id, save_assessments, save_chats, save_games) VALUES (?,1,1,1)'
    ).run(id);

    const rows = [
      [58, 5.5, 6.2, 41, 'Medium', 'Try a 5-minute box-breathing break and a short walk.', 6],
      [48, 7.8, 5.1, 68, 'High', 'Digital sunset tonight and 4-7-8 breathing before bed.', 4],
      [72, 3.1, 7.9, 22, 'Low', 'Great balance. Keep your sleep routine steady.', 2],
      [64, 4.6, 7.2, 29, 'Low', 'Maintain gentle movement and hydration.', 1],
    ];
    const ins = db.prepare(
      `INSERT INTO assessments (id,user_id,hrv,screen_time,sleep,stress_index,category,recommendation,created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`
    );
    rows.forEach((r, i) => {
      ins.run(`ass_seed_${id.slice(-6)}_${i}`, id, r[0], r[1], r[2], r[3], r[4], r[5],
        new Date(Date.now() - r[6] * 86400000).toISOString());
    });

    const profile = {
      totalMarks: 120,
      currentStreak: 3,
      lastActiveDate: dayKey(0),
      level: 2,
      levelTitle: 'Calm Explorer',
      customHabits: [],
      completedDates: {
        [dayKey(2)]: { date: dayKey(2), completedHabitIds: ['habit_breathing', 'habit_yoga_stretch'], dailyMarks: 40, bonusMarks: 0, updatedAt: new Date().toISOString() },
        [dayKey(1)]: { date: dayKey(1), completedHabitIds: ['habit_read_book', 'habit_mindful_hydration'], dailyMarks: 40, bonusMarks: 0, updatedAt: new Date().toISOString() },
      },
    };
    db.prepare('INSERT OR REPLACE INTO habit_profiles (user_id,data,updated_at) VALUES (?,?,?)')
      .run(id, JSON.stringify(profile), new Date().toISOString());
  }
}
