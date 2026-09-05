# Real Telegram OTP backend

This version uses GramJS server-side. It requires a Telegram API ID and API hash supplied through environment variables.

Flow:
1. POST `/api/telegram/send-code` with `{ "phone": "+628..." }`.
2. POST `/api/telegram/verify-code` with `sessionId` and OTP.
3. If Telegram reports `SESSION_PASSWORD_NEEDED`, POST `/api/telegram/verify-2fa` with `sessionId` and the account's 2FA password.
4. The API returns a Telegram StringSession after successful authentication.

Important: do not put API credentials, OTP, 2FA passwords, or StringSessions in frontend code, GitHub JSON, localStorage, or public logs. Use HTTPS and a private server. This backend keeps the in-progress client in memory and expires it after 10 minutes; persistent account sessions should be stored only in a protected server-side secret store if the app later needs automatic reconnection.
