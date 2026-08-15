# Bangun ulang Remindly Smart Scheduler

Membangun ulang fitur inti dari repo `remindly-smart-scheduler` di project ini:
penjadwal pengiriman email pengingat otomatis via SMTP sendiri, dengan tema
putih–hijau elegan.

## Fitur yang dibangun

1. **Login admin** — halaman `/auth` (email + password), semua halaman lain
   terkunci di balik login.
2. **Dashboard pengingat** (`/`) — daftar pengingat, status aktif/nonaktif,
   jadwal berikutnya, aksi kirim-sekarang / edit / hapus.
3. **Buat & edit pengingat** (`/reminders/new`, `/reminders/:id`) — judul,
   penerima To/CC/BCC, subjek, isi email, pilih profil SMTP, zona waktu, dan
   lampiran file.
4. **Penjadwalan** — sekali jalan (tanggal + jam) atau berulang (rentang tanggal,
   hari-hari tertentu dalam seminggu, jam kirim).
5. **Profil SMTP** (`/smtp`) — simpan host, port, TLS, kredensial, alamat
   pengirim; tombol uji koneksi/kirim email tes.
6. **Log pengiriman** (`/logs`) — riwayat sukses/gagal beserta pesan error,
   sumber trigger (otomatis / manual).
7. **Dispatcher otomatis** — endpoint publik terjadwal yang mencari pengingat
   yang jatuh tempo, mengirim email, dan mencatat log (anti-duplikat per
   occurrence).

## Rencana teknis

- **Lovable Cloud** diaktifkan untuk database, autentikasi, dan storage lampiran.
- **Tabel**: `smtp_profiles`, `reminders`, `reminder_schedules`,
  `reminder_attachments`, `send_logs` — mengikuti skema repo asal, lengkap dengan
  GRANT, RLS, dan policy khusus pengguna terautentikasi. Bucket storage
  `attachments` dengan policy baca/tulis untuk pengguna login.
- **Rute** TanStack Start: `/auth`, `/` (dashboard), `/reminders/new`,
  `/reminders/$id`, `/smtp`, `/logs`, plus rute publik
  `/api/public/cron/dispatch` (dilindungi token rahasia) dan endpoint kirim/tes
  email.
- **Pengiriman email** lewat server function memakai kredensial SMTP dari
  `smtp_profiles`; password disimpan di database dan hanya dibaca di server.
- **Logika jadwal** di helper murni (`schedule.ts`) agar occurrence berikutnya
  bisa dihitung konsisten di UI dan dispatcher.
- **Desain**: putih bersih dengan aksen hijau, token warna semantik di
  `src/styles.css` — tidak ada warna hardcode di komponen.

## Catatan

- Kode repo asal tidak diimpor; fitur dibangun ulang di codebase ini.
- Kredensial SMTP nyata Anda isi sendiri lewat halaman `/smtp` setelah selesai.
- Akun admin pertama dibuat lewat halaman sign-up di `/auth`.
