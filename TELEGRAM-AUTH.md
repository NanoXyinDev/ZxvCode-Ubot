# Telegram Auth Bridge

Flow panel: phone -> OTP -> optional 2FA -> done. Vercel hanya menjadi proxy; Telegram credentials/session tidak disimpan di browser atau GitHub.

Bridge endpoints yang dibutuhkan:
- POST /telegram/request-code
- POST /telegram/verify-code
- POST /telegram/verify-2fa

Gunakan bridge HTTPS dan secret yang sama dengan BOT_BRIDGE_SECRET. Implementasi bridge harus menggunakan library Telegram yang memang kamu gunakan dan menyimpan session secara server-side. Jangan mencatat OTP atau password 2FA di log.
