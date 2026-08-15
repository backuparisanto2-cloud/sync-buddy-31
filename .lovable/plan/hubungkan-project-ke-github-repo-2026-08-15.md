# Hubungkan project ke GitHub repo

Tujuan: kode project ini tersinkron dua arah dengan
`backuparisanto2-cloud/remindly-smart-scheduler`.

## Yang perlu Anda lakukan (di UI Lovable)

Git sync hanya bisa diaktifkan dari antarmuka Lovable, bukan dari saya:

1. Buka menu **+** di kiri bawah kolom chat > **GitHub** > **Connect project**.
2. Otorisasi Lovable GitHub App pada akun `backuparisanto2-cloud`.
3. Pilih akun/organisasi tersebut, lalu buat repository.

## Catatan penting

Lovable belum mendukung impor repo yang sudah ada. Saat menghubungkan, Lovable
membuat repo **baru** berisi kode project ini. Jadi ada dua jalur:

- **Repo baru** (mis. `remindly-smart-scheduler-lovable`): paling aman, repo lama
  tetap utuh. Setelah tersambung, Anda bisa merge isi repo lama secara manual
  lewat Git lokal.
- **Pakai nama repo yang sama**: hanya jika repo lama sudah kosong/boleh diganti.

## Setelah tersambung

- Perubahan saya di Lovable otomatis ter-push ke GitHub.
- Push Anda dari lokal otomatis masuk ke Lovable.
- Jika Anda ingin isi repo lama benar-benar hidup di project ini, langkah
  berikutnya adalah clone repo lama dan push kode-nya ke repo yang tersambung —
  atau saya bangun ulang fitur-fiturnya langsung di sini.
