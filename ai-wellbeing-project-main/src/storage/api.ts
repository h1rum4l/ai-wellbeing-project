/**
 * Thin client for the Stressina API (see /server).
 *
 * - Bearer-token auth (works inside the AI Studio preview iframe, where cookies are blocked)
 * - Every write is queued in a persistent "outbox" so nothing is lost if the network drops;
 *   it is replayed in order when the connection returns.
 * - If the API is unreachable the app keeps working in local-only mode.
 */

const API_BASE: string = (import.meta as any).env?.VITE_API_BASE || '/api';
const SESSION_KEY = 'ai_wellbeing_session';
const OUTBOX_KEY = 'ai_wellbeing_outbox';
const REQUEST_TIMEOUT_MS = 8000;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export class NetworkError extends Error {}

/* ---------- safe storage (localStorage can throw in sandboxed iframes) ---------- */
const mem = new Map<string, string>();
function getItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return mem.get(key) ?? null;
  }
}
function setItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    mem.set(key, value);
  }
}
function removeItem(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  mem.delete(key);
}

/* ---------- session ---------- */
interface Session {
  token: string;
  userId: string;
}
export function getSession(): Session | null {
  try {
    const raw = getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
export function setSession(session: Session | null): void {
  if (session) setItem(SESSION_KEY, JSON.stringify(session));
  else removeItem(SESSION_KEY);
}

/* ---------- request ---------- */
export async function request<T>(method: string, path: string, body?: unknown, token?: string | null): Promise<T> {
  const bearer = token === undefined ? getSession()?.token : token;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch {
    throw new NetworkError('Cannot reach the server.');
  } finally {
    clearTimeout(timer);
  }

  // A static host answers unknown /api paths with index.html: treat that as "no backend here".
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  if (!isJson) throw new NetworkError('The API is not available.');

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as any)?.error || `Request failed (${res.status})`);
  return data as T;
}

export async function isApiAvailable(): Promise<boolean> {
  try {
    await request('GET', '/health', undefined, null);
    return true;
  } catch {
    return false;
  }
}

/* ---------- outbox (offline-safe writes) ---------- */
export interface OutboxOp {
  userId: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  /** Ops with the same key replace each other (last write wins), e.g. the habit profile. */
  key?: string;
}

function readOutbox(): OutboxOp[] {
  try {
    const raw = getItem(OUTBOX_KEY);
    return raw ? (JSON.parse(raw) as OutboxOp[]) : [];
  } catch {
    return [];
  }
}
function writeOutbox(ops: OutboxOp[]): void {
  setItem(OUTBOX_KEY, JSON.stringify(ops));
}

export function pendingCount(userId: string): number {
  return readOutbox().filter((o) => o.userId === userId).length;
}

let flushing: Promise<void> | null = null;

export function flushOutbox(): Promise<void> {
  if (flushing) return flushing;
  flushing = (async () => {
    const session = getSession();
    if (!session) return;
    for (;;) {
      const ops = readOutbox();
      const idx = ops.findIndex((o) => o.userId === session.userId);
      if (idx === -1) return;
      const op = ops[idx];
      try {
        await request(op.method, op.path, op.body, session.token);
      } catch (err) {
        if (err instanceof NetworkError) return; // keep it, retry later
        if (err instanceof ApiError && err.status === 401) return; // session expired: keep until re-login
        // Any other rejection is permanent: drop it so the queue can't jam
        console.warn('Dropping rejected sync op', op.method, op.path, err);
      }
      // Re-read: new ops may have been queued (or replaced) while the request was in flight
      const latest = readOutbox();
      const sig = JSON.stringify(op);
      const at = latest.findIndex((o) => JSON.stringify(o) === sig);
      if (at !== -1) latest.splice(at, 1);
      writeOutbox(latest);
    }
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

/** Queue a write for the signed-in user (no-op for guests / local-only accounts). */
export function queueOp(op: OutboxOp): void {
  const session = getSession();
  if (!session || session.userId !== op.userId) return;
  let ops = readOutbox();
  if (op.key) ops = ops.filter((o) => !(o.userId === op.userId && o.key === op.key));
  ops.push(op);
  writeOutbox(ops);
  void flushOutbox();
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void flushOutbox());
}
