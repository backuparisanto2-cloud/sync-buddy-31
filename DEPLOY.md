# Deploy Reminder Mail ke web hosting statis

Antarmuka aplikasi dapat dijalankan sebagai berkas statis (SPA), sementara database,
autentikasi, penyimpanan lampiran, dan pengiriman SMTP tetap berada di backend cloud
yang sudah aktif.

## 1. Siapkan variabel lingkungan

Buat berkas `.env` di root project sebelum build:

```
VITE_SUPABASE_URL=<url backend>
VITE_SUPABASE_PUBLISHABLE_KEY=<kunci publik backend>
VITE_BACKEND_URL=https://project--33193cbb-84a7-4d2f-9ab3-c8f7330b1e67.lovable.app
```

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
