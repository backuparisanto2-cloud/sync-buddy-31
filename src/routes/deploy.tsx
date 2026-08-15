import { createFileRoute } from "@tanstack/react-router";
import { Rocket, Terminal, UploadCloud, Database, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { backendUrl } from "@/lib/backend";

export const Route = createFileRoute("/deploy")({
  head: () => ({
    meta: [
      { title: "Panduan Deploy Statis — Reminder Mail" },
      {
        name: "description",
        content:
          "Langkah membangun versi statis Reminder Mail dan mengunggahnya ke web hosting biasa dengan database yang tetap di cloud.",
      },
      { property: "og:title", content: "Panduan Deploy Statis — Reminder Mail" },
      {
        property: "og:description",
        content: "Build SPA statis, unggah ke hosting, dan tetap pakai database serta SMTP yang ada.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DeployPage,
});

function Step({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Rocket;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 shadow-[var(--shadow-soft)]">
      <CardContent className="space-y-3 p-6">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">{children}</div>
      </CardContent>
    </Card>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-muted p-3 text-xs text-foreground">
      <code>{children}</code>
    </pre>
  );
}

function DeployPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold sm:text-3xl">Panduan deploy ke web hosting</h1>
      <p className="mt-1 mb-6 max-w-2xl text-sm text-muted-foreground">
        Antarmuka bisa di-host sebagai berkas statis (cPanel, Nginx, Netlify, Vercel static, GitHub
        Pages), sementara database, autentikasi, dan pengiriman SMTP tetap berjalan di backend cloud
        yang sudah aktif.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Step icon={Terminal} title="1. Build versi statis">
          <p>Jalankan di komputer Anda setelah mengunduh kode project:</p>
          <Code>{"bun install\nbun run build:static"}</Code>
          <p>
            Hasil siap unggah ada di folder <strong>.output/public</strong>.
          </p>
        </Step>

        <Step icon={UploadCloud} title="2. Unggah ke hosting">
          <p>
            Salin seluruh isi <strong>.output/public</strong> ke document root (mis.{" "}
            <strong>public_html</strong>). Karena ini aplikasi satu halaman, semua URL harus
            diarahkan ke <strong>index.html</strong>.
          </p>
          <p>
            Berkas siap pakai ada di folder <strong>static-hosting/</strong>:{" "}
            <strong>.htaccess</strong> (Apache/cPanel), <strong>_redirects</strong>{" "}
            (Netlify/Cloudflare Pages), dan <strong>nginx.conf.example</strong>.
          </p>
        </Step>

        <Step icon={Database} title="3. Arahkan ke backend yang ada">
          <p>Buat berkas .env sebelum build agar frontend tetap terhubung ke data Anda:</p>
          <Code>
            {`VITE_SUPABASE_URL=https://abcdefghijklmno.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_AbC123dEf456GhI789jkl_00-XyZ\nVITE_SUPABASE_PROJECT_ID=abcdefghijklmno\nVITE_BACKEND_URL=${backendUrl()}`}
          </Code>
          <p>Contoh di atas memakai nilai dummy. Ambil nilai asli dari panel backend Anda.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>VITE_SUPABASE_URL</strong> — alamat API backend, bentuknya{" "}
              <em>https://&lt;id-project&gt;.supabase.co</em>.
            </li>
            <li>
              <strong>VITE_SUPABASE_PUBLISHABLE_KEY</strong> — kunci publik (anon). Aman ikut
              ter-build karena akses data dibatasi aturan baris (RLS). Format lama{" "}
              <em>eyJhbGciOi…</em> juga berlaku.
            </li>
            <li>
              <strong>VITE_SUPABASE_PROJECT_ID</strong> — opsional, bagian subdomain dari URL.
            </li>
            <li>
              <strong>VITE_BACKEND_URL</strong> — dipakai untuk pengiriman email SMTP dan uji
              koneksi, yang harus tetap berjalan di server (tidak bisa dari browser).
            </li>
          </ul>
          <p className="text-destructive">
            Jangan pernah menaruh service role key atau kata sandi database pada build statis —
            semua isi berkas VITE_ bisa dibaca pengunjung.
          </p>
          <p>
            Di panel backend, tambahkan domain hosting Anda ke <strong>Site URL</strong> dan{" "}
            <strong>Redirect URLs</strong> agar proses masuk tidak gagal.
          </p>
        </Step>

        <Step icon={AlertTriangle} title="4. Penjadwal otomatis">
          <p>
            Pengiriman terjadwal dijalankan oleh cron di database yang memanggil endpoint{" "}
            <strong>/api/public/cron/dispatch</strong> pada backend, bukan dari hosting statis.
            Jadi hosting statis tidak perlu cron sendiri.
          </p>
          <p>
            Interval dan zona waktu diatur di halaman <strong>Setelan</strong>.
          </p>
        </Step>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Ringkasan lengkap juga tersedia pada berkas DEPLOY.md di repositori project.
      </p>
    </AppShell>
  );
}
