import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, seedDemoData } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.API_PORT || process.env.PORT || 8787);
const isProd = process.env.NODE_ENV === 'production';
const dataDir = process.env.DATA_DIR || path.resolve(__dirname, '..', 'data');

/* ---------- JWT secret: env var, else generated once and persisted ---------- */
function loadSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const file = path.join(dataDir, '.jwt_secret');
  try {
    return fs.readFileSync(file, 'utf8').trim();
  } catch {
    const s = crypto.randomBytes(48).toString('hex');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(file, s, { mode: 0o600 });
    return s;
  }
}
const JWT_SECRET = loadSecret();
const TOKEN_TTL = '7d';

seedDemoData();

const app = express();
app.set('trust proxy', 1);
// The app is served inside the AI Studio preview iframe, so framing/CSP are left to the host.
app.use(helmet({ contentSecurityPolicy: false, frameguard: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '512kb' }));

/* ---------- helpers ---------- */
const nowIso = () => new Date().toISOString();
const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
const ID_RE = /^[a-z]{3}_[a-z0-9_]{3,48}$/i;
const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const isoOr = (v) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : nowIso());
const bad = (res, message, status = 400) => res.status(status).json({ error: message });
const publicUser = (u) => ({ id: u.id, email: u.email, display_name: u.display_name, created_at: u.created_at });
const sign = (u) => jwt.sign({ sub: u.id }, JWT_SECRET, { expiresIn: TOKEN_TTL });
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
    if (!user) return bad(res, 'Account no longer exists.', 401);
    req.user = user;
    next();
  } catch {
    bad(res, 'Please sign in again.', 401);
  }
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

/* ---------- health ---------- */
app.get('/api/health', (_req, res) => res.json({ ok: true, time: nowIso() }));

/* ---------- auth ---------- */
app.post('/api/auth/register', authLimiter, (req, res) => {
  const email = clean(req.body?.email, 254).toLowerCase();
  const name = clean(req.body?.display_name, 80);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 'Enter a valid email address.');
  if (!name) return bad(res, 'Enter a display name (maximum 80 characters).');
  if (password.length < 6 || password.length > 200) return bad(res, 'Use a password with at least 6 characters.');
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    return bad(res, 'An account with that email already exists.', 409);
  }

  const user = {
    id: newId('usr'),
    email,
    display_name: name,
    password_hash: bcrypt.hashSync(password, 10),
    created_at: nowIso(),
  };
  db.transaction(() => {
    db.prepare('INSERT INTO users (id,email,display_name,password_hash,created_at) VALUES (@id,@email,@display_name,@password_hash,@created_at)').run(user);
    db.prepare('INSERT INTO preferences (user_id,save_assessments,save_chats,save_games) VALUES (?,1,1,1)').run(user.id);
  })();
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  const email = clean(req.body?.email, 254).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  // Always run bcrypt so response time doesn't reveal whether the email exists
  const ok = bcrypt.compareSync(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) return bad(res, 'Email or password was not recognized.', 401);
  res.json({ token: sign(user), user: publicUser(user) });
});

app.get('/api/auth/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

app.patch('/api/profile', auth, (req, res) => {
  const name = clean(req.body?.display_name, 80);
  if (!name) return bad(res, 'Display name must contain 1–80 characters.');
  db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(name, req.user.id);
  res.json({ user: publicUser({ ...req.user, display_name: name }) });
});

/* ---------- preferences ---------- */
const getPrefs = (uid) => {
  const r = db.prepare('SELECT * FROM preferences WHERE user_id = ?').get(uid);
  return {
    save_assessments: !!r?.save_assessments,
    save_chats: !!r?.save_chats,
    save_games: !!r?.save_games,
  };
};
app.get('/api/preferences', auth, (req, res) => res.json(getPrefs(req.user.id)));
app.put('/api/preferences', auth, (req, res) => {
  const b = req.body || {};
  db.prepare(
    `INSERT INTO preferences (user_id,save_assessments,save_chats,save_games) VALUES (?,?,?,?)
     ON CONFLICT(user_id) DO UPDATE SET save_assessments=excluded.save_assessments,
       save_chats=excluded.save_chats, save_games=excluded.save_games`
  ).run(req.user.id, b.save_assessments ? 1 : 0, b.save_chats ? 1 : 0, b.save_games ? 1 : 0);
  res.json(getPrefs(req.user.id));
});

/* ---------- assessments ---------- */
const listAssessments = (uid) =>
  db.prepare('SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC').all(uid);

app.get('/api/assessments', auth, (req, res) => res.json(listAssessments(req.user.id)));
app.post('/api/assessments', auth, (req, res) => {
  const b = req.body || {};
  const hrv = num(b.hrv), screen = num(b.screen_time), sleep = num(b.sleep), idx = num(b.stress_index);
  if ([hrv, screen, sleep, idx].some((v) => v === null)) return bad(res, 'Assessment values must be numbers.');
  if (!['Low', 'Medium', 'High'].includes(b.category)) return bad(res, 'Invalid stress category.');
  const id = ID_RE.test(b.id || '') ? b.id : newId('ass');
  db.prepare(
    `INSERT OR IGNORE INTO assessments (id,user_id,hrv,screen_time,sleep,stress_index,category,recommendation,created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(id, req.user.id, hrv, screen, sleep, idx, b.category, clean(b.recommendation, 500), isoOr(b.created_at));
  res.status(201).json(db.prepare('SELECT * FROM assessments WHERE id = ? AND user_id = ?').get(id, req.user.id));
});
app.delete('/api/assessments/:id', auth, (req, res) => {
  const r = db.prepare('DELETE FROM assessments WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ deleted: r.changes > 0 });
});

/* ---------- conversations ---------- */
const loadConversation = (uid, id) => {
  const c = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?').get(id, uid);
  if (!c) return null;
  c.messages = db.prepare('SELECT role,content,created_at FROM messages WHERE conversation_id = ? ORDER BY seq').all(id);
  return c;
};
const listConversations = (uid) =>
  db.prepare('SELECT id FROM conversations WHERE user_id = ? ORDER BY created_at DESC').all(uid)
    .map((r) => loadConversation(uid, r.id));

app.get('/api/conversations', auth, (req, res) => res.json(listConversations(req.user.id)));
app.get('/api/conversations/:id', auth, (req, res) => {
  const c = loadConversation(req.user.id, req.params.id);
  c ? res.json(c) : bad(res, 'Conversation not found.', 404);
});
app.post('/api/conversations', auth, (req, res) => {
  const b = req.body || {};
  const msgs = Array.isArray(b.messages) ? b.messages.slice(0, 200) : [];
  const valid = msgs.filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string');
  if (valid.length === 0) return bad(res, 'A conversation needs at least one message.');
  const id = ID_RE.test(b.id || '') ? b.id : newId('cnv');
  const first = valid.find((m) => m.role === 'user');
  const title = clean(b.title, 70) || clean(first?.content, 70) || 'Wellbeing chat';
  db.transaction(() => {
    const r = db.prepare('INSERT OR IGNORE INTO conversations (id,user_id,title,created_at) VALUES (?,?,?,?)')
      .run(id, req.user.id, title, isoOr(b.created_at));
    if (r.changes === 0) return; // idempotent retry
    const ins = db.prepare('INSERT INTO messages (conversation_id,role,content,created_at) VALUES (?,?,?,?)');
    for (const m of valid) ins.run(id, m.role, m.content.slice(0, 2000), isoOr(m.created_at));
  })();
  res.status(201).json(loadConversation(req.user.id, id));
});
app.delete('/api/conversations/:id', auth, (req, res) => {
  const r = db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ deleted: r.changes > 0 });
});
app.delete('/api/conversations', auth, (req, res) => {
  const r = db.prepare('DELETE FROM conversations WHERE user_id = ?').run(req.user.id);
  res.json({ deleted: r.changes });
});

/* ---------- game sessions ---------- */
const listGames = (uid) =>
  db.prepare('SELECT * FROM game_sessions WHERE user_id = ? ORDER BY created_at DESC').all(uid);
app.get('/api/games', auth, (req, res) => res.json(listGames(req.user.id)));
app.post('/api/games', auth, (req, res) => {
  const b = req.body || {};
  const name = clean(b.game_name, 80);
  if (!name) return bad(res, 'Game name is required.');
  const id = ID_RE.test(b.id || '') ? b.id : newId('gam');
  const dur = Math.max(0, Math.min(86400, Math.round(num(b.duration_seconds) ?? 0)));
  db.prepare('INSERT OR IGNORE INTO game_sessions (id,user_id,game_name,duration_seconds,reflection,created_at) VALUES (?,?,?,?,?,?)')
    .run(id, req.user.id, name, dur, clean(b.reflection, 500), isoOr(b.created_at));
  res.status(201).json(db.prepare('SELECT * FROM game_sessions WHERE id = ? AND user_id = ?').get(id, req.user.id));
});

/* ---------- counsellor demo requests ---------- */
const listRequests = (uid) =>
  db.prepare('SELECT * FROM counsellor_requests WHERE user_id = ? ORDER BY created_at DESC').all(uid)
    .map((r) => ({ ...r, consent: !!r.consent }));
app.get('/api/counsellor-requests', auth, (req, res) => res.json(listRequests(req.user.id)));
app.post('/api/counsellor-requests', auth, (req, res) => {
  const b = req.body || {};
  if (b.consent !== true) return bad(res, 'Consent is required.');
  const id = ID_RE.test(b.id || '') ? b.id : newId('req');
  db.prepare(
    `INSERT OR IGNORE INTO counsellor_requests (id,user_id,preferred_contact,preferred_time,message,consent,status,created_at)
     VALUES (?,?,?,?,?,1,?,?)`
  ).run(id, req.user.id, clean(b.preferred_contact, 120), clean(b.preferred_time, 120), clean(b.message, 1000),
    'Demo request — not sent', isoOr(b.created_at));
  const row = db.prepare('SELECT * FROM counsellor_requests WHERE id = ? AND user_id = ?').get(id, req.user.id);
  res.status(201).json({ ...row, consent: true });
});

/* ---------- habits / quest profile ---------- */
const getHabits = (uid) => {
  const r = db.prepare('SELECT data FROM habit_profiles WHERE user_id = ?').get(uid);
  try { return r ? JSON.parse(r.data) : null; } catch { return null; }
};
app.get('/api/habits/profile', auth, (req, res) => res.json({ profile: getHabits(req.user.id) }));
app.put('/api/habits/profile', auth, (req, res) => {
  const p = req.body?.profile;
  if (!p || typeof p !== 'object' || Array.isArray(p)) return bad(res, 'Invalid habit profile.');
  if (num(p.totalMarks) === null || p.totalMarks < 0 || num(p.currentStreak) === null || p.currentStreak < 0) {
    return bad(res, 'Invalid habit profile values.');
  }
  if (typeof p.completedDates !== 'object' || p.completedDates === null) return bad(res, 'Invalid habit history.');
  if (!Array.isArray(p.customHabits) || p.customHabits.length > 100) return bad(res, 'Invalid custom habits.');
  db.prepare(
    `INSERT INTO habit_profiles (user_id,data,updated_at) VALUES (?,?,?)
     ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`
  ).run(req.user.id, JSON.stringify(p), nowIso());
  res.json({ ok: true });
});

/* ---------- bulk sync / export / delete ---------- */
const snapshot = (user) => ({
  user: publicUser(user),
  preferences: getPrefs(user.id),
  assessments: listAssessments(user.id),
  conversations: listConversations(user.id),
  game_sessions: listGames(user.id),
  counsellor_requests: listRequests(user.id),
  habit_profile: getHabits(user.id),
});
app.get('/api/sync', auth, (req, res) => res.json(snapshot(req.user)));

app.get('/api/export', auth, (req, res) => {
  const s = snapshot(req.user);
  res.json({
    profile: { email: s.user.email, display_name: s.user.display_name, created_at: s.user.created_at },
    preferences: s.preferences,
    assessments: s.assessments,
    conversations: s.conversations,
    game_sessions: s.game_sessions,
    counsellor_demo_requests: s.counsellor_requests,
    habits: s.habit_profile,
    export_note: 'Counsellor requests are demo records, not sent to a real service.',
    exported_at: nowIso(),
  });
});

app.delete('/api/account', auth, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id); // cascades to all of the user's data
  res.json({ deleted: true });
});

/* ---------- errors & static hosting ---------- */
app.use('/api', (_req, res) => bad(res, 'Not found.', 404));

const dist = path.resolve(__dirname, '..', 'dist');
if (isProd && fs.existsSync(dist)) {
  app.use(express.static(dist));
  // SPA fallback (Express 5 no longer accepts a bare '*' route)
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed') return bad(res, 'Malformed JSON.');
  if (err?.type === 'entity.too.large') return bad(res, 'Request too large.', 413);
  console.error(err);
  bad(res, 'Server error.', 500);
});

app.listen(PORT, '0.0.0.0', () => console.log(`Stressina API listening on :${PORT}`));
