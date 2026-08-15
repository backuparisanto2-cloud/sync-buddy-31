# Panduan Supabase untuk Static Hosting + Halaman Log Detail

## 1. Panduan konfigurasi Supabase (khusus hosting statis)

Menambah bagian baru di `DEPLOY.md` dan di halaman **Deploy** dalam aplikasi:

- Tabel variabel lingkungan lengkap dengan kegunaan, sisi pemakaian (browser vs server), dan contoh nilai:

```text
VITE_SUPABASE_URL=https://abcdefghijklmno.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_XXXXXXXXXXXXXXXXXXXXXX
VITE_SUPABASE_PROJECT_ID=abcdefghijklmno
VITE_BACKEND_URL=https://project--<id>.lovable.app
```

- Penegasan mana yang **tidak boleh** ikut ke build statis: service role key dan password database hanya hidup di backend, tidak pernah diawali `VITE_`.
- Catatan kunci akses: kunci publik (publishable/anon) aman berada di bundel browser karena akses dibatasi RLS; setiap tabel aplikasi ini hanya bisa dibaca pengguna terautentikasi.
- Langkah verifikasi: cek `/auth` bisa login, dasbor memuat data, halaman SMTP bisa uji kirim — jika gagal, daftar penyebab umum (URL salah, kunci lama format JWT, domain hosting belum diizinkan, `VITE_BACKEND_URL` kosong).
- Catatan bahwa perubahan `.env` mengharuskan build ulang, karena nilai `VITE_*` ditanam saat build.

## 2. Halaman log pengiriman detail

Halaman **Riwayat** saat ini hanya menampilkan daftar ringkas tanpa filter. Rencana:

- Filter per reminder (dropdown daftar reminder + opsi "Semua"), filter status (semua/berhasil/gagal), filter sumber (otomatis/manual/uji), dan pencarian penerima.
- Tabel/daftar detail per baris menampilkan: judul reminder, penerima, waktu kirim (timestamp lengkap dengan zona waktu), waktu jadwal (occurrence), sumber pemicu, status, **kode respons SMTP**, **pesan respons server SMTP**, dan durasi pengiriman.
- Baris bisa diperluas untuk melihat respons SMTP mentah (mis. `250 2.0.0 OK 1723710000 ...`) dan pesan error penuh.
- Tautan cepat "Buka reminder" dan tombol muat lebih banyak (di luar 200 entri terakhir).
- Dari halaman reminder, tombol menuju log yang sudah terfilter untuk reminder tersebut.

### Menangkap kode respons SMTP

Klien SMTP sudah membaca kode balasan tiap perintah, tetapi kode itu belum disimpan. Perubahan:

- Migrasi database menambah kolom pada tabel log pengiriman: kode respons SMTP, teks respons SMTP, tahap terakhir (mis. `AUTH`, `RCPT`, `DATA`), dan durasi pengiriman dalam milidetik.
- Fungsi pengiriman mengembalikan kode + teks balasan akhir (dan pada kegagalan, kode/teks pada tahap yang gagal), lalu nilai itu ikut disimpan ke log untuk pengiriman otomatis, manual, maupun email uji.
- Log lama tanpa data tersebut ditampilkan sebagai "—".

## Detail teknis

- Migrasi: `ALTER TABLE public.send_logs ADD COLUMN smtp_code integer, smtp_response text, smtp_stage text, duration_ms integer;` (grant/RLS tabel tidak berubah).
- `src/lib/smtp.server.ts`: `sendMail`/`testSmtp` mengembalikan `{ code, text, stage }`; error dilempar dengan properti kode/tahap agar bisa dicatat.
- `src/lib/mailer.server.ts`: `sendReminder` dan `sendTestEmail` menulis kolom baru ke `send_logs`.
- `src/lib/app.functions.ts`: `fetchLogs` menerima filter (`reminderId`, `status`, `source`, `search`, `limit`, `offset`) dan mengembalikan kolom baru.
- `src/routes/logs.tsx`: ditulis ulang menjadi halaman detail dengan panel filter, baris yang bisa diperluas, dukungan query param `?reminder=<id>`, dan `head()` metadata sendiri.
- `DEPLOY.md` + `src/routes/deploy.tsx`: bagian "Konfigurasi Supabase untuk hosting statis".
