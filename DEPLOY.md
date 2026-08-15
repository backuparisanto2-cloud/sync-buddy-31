# Deploy Reminder Mail ke web hosting statis

Antarmuka aplikasi dapat dijalankan sebagai berkas statis (SPA), sementara database,
autentikasi, penyimpanan lampiran, dan pengiriman SMTP tetap berada di backend cloud
yang sudah aktif.

## 1. Konfigurasi backend untuk hosting statis

Build statis hanya membaca variabel berawalan `VITE_` dan nilainya ikut tertanam di
berkas JavaScript hasil build. Karena itu **hanya kunci publik** yang boleh dipakai.

| Variabel | Wajib | Contoh nilai | Keterangan |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | ya | `https://abcdefghijklmno.supabase.co` | Alamat API backend (Project URL). |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ya | `sb_publishable_AbC123dEf456GhI789jkl_00-XyZ` | Kunci publik (anon/publishable). Aman terekspos karena semua akses dibatasi aturan baris (RLS). Format lama `eyJhbGciOi...` juga berlaku. |
| `VITE_SUPABASE_PROJECT_ID` | opsional | `abcdefghijklmno` | Bagian subdomain dari Project URL. |
| `VITE_BACKEND_URL` | ya | `https://project--33193cbb-84a7-4d2f-9ab3-c8f7330b1e67.lovable.app` | Backend yang menjalankan SMTP dan penjadwal. |

Isi nilai asli project Anda dari panel backend Lovable Cloud (menu **View Backend**).

Buat berkas `.env` di root project sebelum build:

```
VITE_SUPABASE_URL=https://abcdefghijklmno.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_AbC123dEf456GhI789jkl_00-XyZ
VITE_SUPABASE_PROJECT_ID=abcdefghijklmno
VITE_BACKEND_URL=https://project--33193cbb-84a7-4d2f-9ab3-c8f7330b1e67.lovable.app
```

**Jangan pernah** memasukkan `SUPABASE_SERVICE_ROLE_KEY` atau kata sandi database ke
build statis — kunci itu hanya boleh hidup di server backend.

Checklist backend agar hosting statis berfungsi:

1. **Auth → URL Configuration**: tambahkan domain hosting Anda (mis.
   `https://reminder.domainanda.com`) ke *Site URL* dan *Redirect URLs*, jika tidak
   login/OAuth akan gagal redirect.
2. **RLS aktif** di semua tabel (`reminders`, `reminder_schedules`,
   `reminder_attachments`, `smtp_profiles`, `send_logs`, `app_settings`) — sudah
   dikonfigurasi otomatis di project ini.
3. **Storage bucket `attachments`** bersifat privat; lampiran diakses lewat URL
   bertanda tangan.
4. `VITE_BACKEND_URL` harus dapat diakses publik agar tombol uji dan pengiriman SMTP
   berjalan.

`VITE_BACKEND_URL` dipakai untuk endpoint pengiriman email (`/api/public/mail/*`) dan
penjadwal (`/api/public/cron/dispatch`) yang wajib berjalan di server.


## 2. Build

```bash
bun install
bun run build:static
```

Hasil build statis ada di `.output/public`.

## 3. Unggah

Salin seluruh isi `.output/public` ke document root hosting (mis. `public_html`).
Karena aplikasi memakai routing sisi klien, seluruh URL harus diarahkan ke `index.html`.

Berkas contoh tersedia di folder `static-hosting/`:

- `.htaccess` — Apache / cPanel (salin ke document root)
- `_redirects` — Netlify / Cloudflare Pages
- `nginx.conf.example` — konfigurasi Nginx

## 4. Database dan SMTP

Tidak ada perubahan: data tetap di backend cloud yang sama, kredensial SMTP disimpan
terenkripsi di database, dan pengiriman dilakukan oleh backend.

## 5. Penjadwal otomatis

Cron di database memanggil `POST {VITE_BACKEND_URL}/api/public/cron/dispatch` sesuai
interval yang dipilih di halaman **Setelan**. Hosting statis tidak perlu cron sendiri.
Zona waktu default, interval pengecekan, jendela pengiriman susulan, dan tombol
aktif/nonaktif penjadwal semuanya diatur dari halaman tersebut.

## 6. Uji coba

- Halaman **SMTP**: tombol **Uji** memeriksa koneksi, kolom email + **Kirim email uji**
  mengirim email nyata.
- Halaman **Ubah reminder**: tombol **Tes kirim sekarang** mengirim isi pengingat ke
  penerima sungguhan dan tercatat di **Riwayat**.
