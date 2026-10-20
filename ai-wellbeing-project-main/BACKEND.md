# Stressina.Ai backend

A small Node + Express + SQLite (Node built-in `node:sqlite`, no compiler needed) API that stores accounts and wellbeing data on the server instead of only in the browser.

## Run it

Requires **Node.js 22.13 or newer** (check with `node -v`). The database uses Node's built-in SQLite, so there is nothing native to compile.

```bash
npm install
npm run dev      # API on :8787 + web app on :3000 (the web app proxies /api to the API)
```

Production (one process serves both the API and the built app):

```bash
npm run build
npm start        # http://localhost:8787
```

Optional environment variables (see `.env.example`): `API_PORT`, `JWT_SECRET`, `DATA_DIR`.
If `JWT_SECRET` is not set, a random one is generated once and saved to `data/.jwt_secret`.
The database file is `data/stressina.sqlite` (git-ignored). Set `JWT_SECRET` and keep `data/` on persistent storage when deploying.

## Demo accounts (seeded automatically)

| Email | Password |
|---|---|
| maya@example.com | password123 |
| maya@stressina.ai | stressina123 |

Maya starts with a saved stress timeline and 120 marks.

## API

All routes are under `/api`. Everything except `health`, `auth/register` and `auth/login` needs `Authorization: Bearer <token>`.

| Method | Route | Purpose |
|---|---|---|
| GET | /health | Liveness check |
| POST | /auth/register, /auth/login | Create account / sign in (returns `token` + `user`) |
| GET | /auth/me | Validate the saved session |
| PATCH | /profile | Change display name |
| GET, PUT | /preferences | Privacy toggles |
| GET, POST | /assessments · DELETE /assessments/:id | Stress check-in history |
| GET, POST | /conversations · GET, DELETE /conversations/:id · DELETE /conversations | Saved chats |
| GET, POST | /games | Relax & play sessions |
| GET, POST | /counsellor-requests | Counsellor demo requests |
| GET, PUT | /habits/profile | Quest marks, streak, custom habits |
| GET | /sync | Everything for the signed-in user in one call |
| GET | /export | Full personal-data export |
| DELETE | /account | Delete the account and all its data |

## How the app uses it

- Sign-in / sign-up go to the server; passwords are hashed with bcrypt and sessions use 7-day signed tokens.
- The app keeps a local copy for speed. Every change is also queued and sent to the server; if the connection drops, queued changes are retried automatically.
- If the API cannot be reached at all, the app falls back to the old browser-only demo mode, so the preview never breaks.
- Signing out removes that user's cached data from the device; signing back in restores it from the server.
- Login attempts are rate-limited (30 per 15 minutes per IP).

## Not included yet

- Password reset / email verification (needs an email service).
- Server-side AI chat (the assistant still runs in the browser).
