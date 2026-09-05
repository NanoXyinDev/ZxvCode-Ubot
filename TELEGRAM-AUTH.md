# Telegram connection bridge

The Vercel app is a frontend/API proxy. It does not run a persistent Telegram client.

Required bridge endpoints:
- `POST /telegram/request-code` -> `{ ok: true, sessionId: "..." }`
- `POST /telegram/verify-code` -> `{ ok: true, needs2fa: true }` or `{ ok: true }`
- `POST /telegram/verify-2fa` -> `{ ok: true }`
- `GET /groups` -> `{ ok: true, groups: [{ id, title, blacklisted }] }`
- `POST /broadcast` -> `{ ok: true, sent, total, results }`

Set these Vercel environment variables:
- `BOT_BRIDGE_URL`
- `BOT_BRIDGE_SECRET`
- `GITHUB_TOKEN`
- `AUTH_SECRET`

Never put GitHub, Telegram, OTP, 2FA, or bridge secrets into browser JavaScript, localStorage, or a public repository.
