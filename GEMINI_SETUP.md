# Gemini chat

Both chat interfaces call `POST /api/chat`. Vercel runs `api/chat.js`; local Express uses the same handler in `server/gemini.js`. No API key is included in the browser bundle.

Set `GOOGLE_GENERATIVE_AI_API_KEY` in the project root `.env` for `npm run dev`, and as a secret in Vercel's Production environment before deploying. Never prefix this key with `VITE_` or commit `.env`.

The default model is `gemini-3.1-flash-lite`, verified with this project's key. Override with `GEMINI_MODEL` if needed. Provider quotas and model availability can change. API failures produce a visible retry message, not a scripted AI response.

Chat sends the last 20 messages to Google. Assessment context is included only when the user enables sharing. The UI discloses that Google may use free-tier chat content to improve products. Existing client crisis handling stays in place; the server also instructs Gemini to offer supportive, non-clinical responses.

Verification: `npm run lint`, `npm run build`, `node --test tests/gemini.test.js`. Production TypeScript excludes existing Vitest files because this repository has no Vitest dependency; those older tests require their own runner.

The public endpoint bounds input and output and times out provider requests. Local Express limits requests per IP; for production abuse protection configure Vercel Firewall rate limiting (local in-memory limits do not provide global serverless enforcement).

References: https://ai.google.dev/api/generate-content and https://vercel.com/docs/frameworks/frontend/vite
