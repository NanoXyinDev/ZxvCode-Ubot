# UBOT Broadcast Studio V6

Polished line-style dashboard with dark/light theme, responsive layout, authentication, Telegram connection flow, group selection, select-all, drafts, dry-run, delivery progress and bridge proxy.

## Vercel
Deploy this directory as the project root. No wrapper folder is required in the ZIP.

Required environment variables:
`GITHUB_TOKEN`, `AUTH_SECRET`, `BOT_BRIDGE_URL`, `BOT_BRIDGE_SECRET`.

The Telegram bridge must be a persistent server you control. Vercel handles the web layer and short-lived API proxy requests.

## Auth
`/login` and `/register` use the GitHub Contents API for the configured JSON database. The GitHub token stays server-side.
