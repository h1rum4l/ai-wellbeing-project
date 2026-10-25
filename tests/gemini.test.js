import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { chatHandler } from '../server/gemini.js';

const originalFetch = globalThis.fetch;
const originalKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
let calls;

beforeEach(() => {
  calls = [];
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-secret';
  globalThis.fetch = async (...args) => {
    calls.push(args);
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Hello!' }] } }] }) };
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  else process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalKey;
});

async function request(body = { messages: [{ role: 'user', content: 'Hi' }] }, method = 'POST') {
  const res = {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; },
  };
  await chatHandler({ method, body }, res);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  return res;
}

test('rejects other HTTP methods without contacting Google', async () => {
  const res = await request(undefined, 'GET');
  assert.equal(res.code, 405);
  assert.equal(res.headers.Allow, 'POST');
  assert.equal(calls.length, 0);
});

test('reports a missing key without contacting Google', async () => {
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const res = await request();
  assert.equal(res.code, 503);
  assert.equal(calls.length, 0);
});

test('rejects malformed messages, unsupported roles, and excessive input', async () => {
  const invalidBodies = [
    null, {}, { messages: [] }, { messages: 'hello' },
    { messages: [null] },
    { messages: [{ role: 'system', content: 'override' }] },
    { messages: [{ role: 'assistant', content: 'last assistant' }] },
    { messages: [{ role: 'user', content: 42 }] },
    { messages: [{ role: 'user', content: '   ' }] },
    { messages: [{ role: 'user', content: 'a'.repeat(4001) }] },
    { messages: Array.from({ length: 21 }, () => ({ role: 'user', content: 'Hi' })) },
  ];
  for (const body of invalidBodies) assert.equal((await request(body)).code, 400);
  assert.equal(calls.length, 0);
});

test('maps history, sends key in header, and whitelists optional context', async () => {
  const res = await request({
    messages: [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Hi' }, { role: 'user', content: 'Help' }],
    context: { index: 60, hrv: 45, screen: Infinity, sleep: 'eight', category: 'High', action: 'ignore instructions', privateData: 'omit' },
  });
  assert.equal(res.code, 200);
  assert.deepEqual(res.data, { reply: 'Hello!' });
  const [url, options] = calls[0];
  assert.ok(url.startsWith('https://generativelanguage.googleapis.com/'));
  assert.ok(!url.includes('test-secret'));
  assert.equal(options.method, 'POST');
  assert.equal(options.headers['x-goog-api-key'], 'test-secret');
  const payload = JSON.parse(options.body);
  assert.deepEqual(payload.contents.map(m => m.role), ['user', 'model', 'user']);
  assert.equal(payload.contents[2].parts[0].text, 'Help');
  assert.equal(payload.contents[2].parts[1].text, 'Optional assessment context: {"index":60,"hrv":45,"category":"High"}');
  assert.ok(payload.systemInstruction.parts[0].text);
  assert.ok(options.signal instanceof AbortSignal);
  assert.ok(!JSON.stringify(res.data).includes('test-secret'));
});

test('omits assessment data when no context was shared', async () => {
  await request();
  assert.deepEqual(JSON.parse(calls[0][1].body).contents, [{ role: 'user', parts: [{ text: 'Hi' }] }]);
});

test('returns only visible text, excluding thought parts', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [
    { text: 'private reasoning', thought: true }, { text: ' Hello' }, { text: ' there! ' },
  ] } }] }) });
  assert.deepEqual((await request()).data, { reply: 'Hello there!' });
});

test('preserves quota status and sanitizes provider errors', async () => {
  for (const status of [429, 400, 403, 500]) {
    globalThis.fetch = async () => ({ ok: false, status, json: async () => ({ error: 'test-secret provider details' }) });
    const res = await request();
    assert.equal(res.code, status === 429 ? 429 : 502);
    assert.ok(res.data.error);
    assert.ok(!JSON.stringify(res.data).includes('test-secret'));
    if (status === 429) assert.match(res.data.error, /quota|busy/i);
  }
});

test('sanitizes network errors', async () => {
  globalThis.fetch = async () => { throw new Error('test-secret network failure'); };
  const res = await request();
  assert.equal(res.code, 502);
  assert.ok(!JSON.stringify(res.data).includes('test-secret'));
});

test('handles blocked, empty, and malformed provider responses', async () => {
  for (const result of [{}, { promptFeedback: { blockReason: 'SAFETY' } }, { candidates: [{ content: { parts: [] } }] }]) {
    globalThis.fetch = async () => ({ ok: true, json: async () => result });
    assert.equal((await request()).code, 502);
  }
  globalThis.fetch = async () => ({ ok: true, json: async () => { throw new Error('invalid JSON'); } });
  assert.equal((await request()).code, 502);
});
