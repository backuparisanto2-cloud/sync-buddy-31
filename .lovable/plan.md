# Deploy Statis + Pengaturan Penjadwal + Tombol Tes Kirim

Tiga pekerjaan digabung dalam satu rangkaian.

## 1. Halaman bisa di-deploy statis ke web hosting biasa

Aplikasi diubah agar hasil build berupa file statis (HTML/CSS/JS) yang bisa diunggah ke hosting apa pun (cPanel, Hostinger, Netlify, Vercel static, GitHub Pages), sementara database, login, dan penyimpanan lampiran tetap memakai Supabase yang sudah ada.

- Build statis (SPA): seluruh halaman dirender di browser, tanpa server Node.
- Semua akses data sudah langsung dari browser ke Supabase (`src/lib/app.functions.ts`), jadi tidak ada perubahan logika data.
- Pengiriman email SMTP tetap butuh server (soket TCP), jadi endpoint `/api/public/mail/*` dan cron dispatch tetap berjalan di backend Lovable. Frontend statis memanggilnya lewat `VITE_BACKEND_URL`.
- Menambah file fallback routing agar refresh di URL dalam (mis. `/smtp`) tidak 404: `public/.htaccess` (Apache), `public/_redirects` (Netlify), dan contoh blok Nginx di panduan.
- Menambah `DEPLOY.md` (bahasa Indonesia): langkah build, daftar variabel `.env` yang harus diisi, cara unggah isi folder hasil build, pengaturan fallback per jenis hosting, pengaturan URL yang diizinkan di Auth Supabase (Site URL + Redirect URL domain baru), serta catatan bahwa pengiriman email memakai URL backend.
- Menambah halaman `/deploy` di dalam aplikasi berisi panduan singkat yang sama plus tampilan nilai konfigurasi yang sedang dipakai (URL backend aktif), agar mudah dicek setelah di-hosting.

## 2. Pengaturan zona waktu dan interval penjadwal

- Tabel baru `app_settings` (satu baris): zona waktu default, interval pengecekan dalam menit, jendela susulan (berapa jam pengingat telat masih dikirim), dan status aktif penjadwal.
- Halaman `/settings`: pilih zona waktu default (dipakai sebagai nilai awal saat membuat pengingat baru), pilih interval pengecekan (1, 5, 10, 15, 30, 60 menit), jendela susulan, dan sakelar aktif/nonaktif penjadwal.
- Menyimpan pengaturan juga memperbarui jadwal cron di database agar frekuensi pengecekan mengikuti pilihan pengguna.
- Endpoint dispatch membaca pengaturan: jika penjadwal dimatikan, ia berhenti tanpa mengirim; jendela susulan memakai nilai dari pengaturan (sekarang masih 6 jam permanen).
- Form pengingat memakai zona waktu default dari pengaturan untuk pengingat baru.

## 3. Tombol tes kirim

- Halaman SMTP: tombol tes yang ada sekarang hanya mengecek koneksi. Ditambah tombol "Kirim Email Uji" dengan kolom alamat tujuan, yang benar-benar mengirim satu email percobaan melalui profil tersebut dan mencatat hasilnya di riwayat.
- Halaman detail/edit pengingat: tombol "Tes Kirim Sekarang" yang mengirim isi pengingat tersebut (beserta lampiran) ke penerima, ditandai sebagai pengiriman manual di riwayat.

## Rincian teknis

- Build: aktifkan mode SPA TanStack Start (shell prerender + `ssr: false` di root) sehingga `vite build` menghasilkan folder statis; skrip `build:static` ditambahkan ke `package.json`.
- `src/lib/backend.ts` tetap dipakai; `VITE_BACKEND_URL` menjadi wajib diisi untuk hosting non-Lovable dan divalidasi dengan pesan yang jelas.
- Migrasi SQL: `app_settings` + GRANT + RLS (baca/tulis untuk pengguna terautentikasi), dan fungsi untuk menjadwal ulang `cron.schedule` sesuai interval.
- `dispatchDue()` di `src/lib/mailer.server.ts` membaca `app_settings` sebelum memproses.
- Endpoint baru `/api/public/mail/test-send` untuk email uji ke alamat bebas; memakai verifikasi token pengguna yang sudah ada di `src/lib/mail-api.server.ts`.
