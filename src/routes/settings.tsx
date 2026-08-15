import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Timer } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchSettings, saveSettings, useServerFn, type AppSettings } from "@/lib/app.functions";
import { deviceTimezone, TIMEZONES, timezoneLabel } from "@/lib/format";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan Penjadwal — Reminder Mail" },
      {
        name: "description",
        content:
          "Atur zona waktu default, interval pengecekan pengingat, jendela pengiriman susulan, dan aktif/nonaktif penjadwal otomatis.",
      },
      { property: "og:title", content: "Pengaturan Penjadwal — Reminder Mail" },
      {
        property: "og:description",
        content: "Sesuaikan zona waktu dan seberapa sering pengingat dicek otomatis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const INTERVALS = [1, 5, 10, 15, 30, 60] as const;

function SettingsPage() {
  const qc = useQueryClient();
  const load = useServerFn(fetchSettings);
  const save = useServerFn(saveSettings);
  const query = useQuery({ queryKey: ["settings"], queryFn: () => load() });
  const [form, setForm] = useState<AppSettings | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (query.data) setForm(query.data);
  }, [query.data]);

  const tzOptions = useMemo(() => {
    const list = [...TIMEZONES];
    const device = deviceTimezone();
    for (const tz of [device, form?.default_timezone]) {
      if (tz && !list.some((t) => t.value === tz)) list.unshift({ value: tz, label: tz });
    }
    return list;
  }, [form?.default_timezone]);

  async function submit() {
    if (!form) return;
    setBusy(true);
    try {
      const res = await save({ data: form });
      toast.success(
        res.schedule === "no-job"
          ? "Pengaturan tersimpan (pekerjaan cron belum terpasang)"
          : `Pengaturan tersimpan · jadwal cron: ${res.schedule}`,
      );
      qc.invalidateQueries({ queryKey: ["settings"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold sm:text-3xl">Pengaturan penjadwal</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Zona waktu default dan seberapa sering sistem memeriksa pengingat yang jatuh tempo.
      </p>

      {!form ? (
        <Card className="border-border/70">
          <CardContent className="p-8 text-sm text-muted-foreground">Memuat…</CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl border-border/70 shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Timer className="h-5 w-5 text-primary" />
              Penjadwal otomatis
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-4">
              <div>
                <p className="text-sm font-medium">Aktifkan penjadwal</p>
                <p className="text-xs text-muted-foreground">
                  Jika dimatikan, pengingat tidak akan terkirim otomatis.
                </p>
              </div>
              <Switch
                checked={form.scheduler_enabled}
                onCheckedChange={(v) => setForm({ ...form, scheduler_enabled: v })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Zona waktu default</Label>
                <Select
                  value={form.default_timezone}
                  onValueChange={(v) => setForm({ ...form, default_timezone: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tzOptions.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Dipakai sebagai nilai awal pengingat baru ({timezoneLabel(form.default_timezone)}).
                </p>
              </div>

              <div className="space-y-2">
                <Label>Interval pengecekan</Label>
                <Select
                  value={String(form.check_interval_minutes)}
                  onValueChange={(v) => setForm({ ...form, check_interval_minutes: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVALS.map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        Setiap {m} menit
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Menyimpan juga memperbarui jadwal cron di database.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="catchup">Jendela susulan (jam)</Label>
                <Input
                  id="catchup"
                  type="number"
                  min={1}
                  max={72}
                  value={form.catchup_hours}
                  onChange={(e) =>
                    setForm({ ...form, catchup_hours: Math.max(1, Number(e.target.value) || 1) })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Pengingat yang telat masih dikirim selama belum melewati batas ini.
                </p>
              </div>
            </div>

            <Button onClick={submit} disabled={busy} className="rounded-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan pengaturan
            </Button>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
