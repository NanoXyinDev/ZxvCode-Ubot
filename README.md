# UBOT Broadcast Studio V9 — OTP Ready

UI mengikuti arah visual reference project: neon/glass cards, Orbitron/Rajdhani/Share Tech Mono, sidebar/dashboard feel, responsive scrolling, dark/light support, dan flow Telegram OTP.

## OTP flow
Phone -> Send OTP -> Verify OTP -> optional 2FA -> Connected.

Frontend tidak menyimpan OTP atau password 2FA. Endpoint adapter sengaja mengembalikan 501 sampai dihubungkan ke backend Telegram milikmu.

## Deploy
Static UI dapat di-deploy ke Vercel. Untuk Telegram client/session nyata, gunakan backend/server yang kamu kontrol dan hubungkan adapter secara server-side.
