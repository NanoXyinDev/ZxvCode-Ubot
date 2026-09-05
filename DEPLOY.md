# UBOT Broadcast Studio

Frontend static panel intended for Vercel. Vercel supports deploying static sites and ZIPs through Vercel Drop. The Telegram userbot/bridge should remain on a persistent server; this panel only talks to its HTTP bridge.

## Added in this revision
- Dark/light theme
- Line-based visual system
- Responsive mobile layout
- Search and select-all target controls
- Local draft save/load
- Settings export
- Consent confirmation gate
- Dry-run preview mode
- Improved group rows and activity dashboard
- Safer 5s+ delay presets

## Vercel
Upload the `web-panel` directory or ZIP to Vercel. If deploying from Git, set the project root to `web-panel`.

Do not put Telegram session files, API hashes, or bridge secrets in public frontend files. Use environment variables/server-side configuration for secrets.
