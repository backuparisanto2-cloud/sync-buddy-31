import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchSettings, useServerFn } from "@/lib/app.functions";
import { AppShell } from "@/components/AppShell";
import { ReminderForm, emptyReminder } from "@/components/ReminderForm";

export const Route = createFileRoute("/reminders/new")({
  head: () => ({
    meta: [
      { title: "Buat Reminder Email Baru — Reminder Mail" },
      {
        name: "description",
        content:
          "Buat pengingat email baru: tentukan penerima, subjek, isi pesan, periode tanggal, jam kirim, dan lampiran.",
      },
      { property: "og:title", content: "Buat Reminder Email Baru — Reminder Mail" },
      {
        property: "og:description",
        content: "Atur penerima, periode tanggal, jam kirim, dan lampiran untuk pengingat email.",
      },
    ],
  }),
  component: NewReminder,
});

function NewReminder() {
  const loadSettings = useServerFn(fetchSettings);
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => loadSettings() });
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold sm:text-3xl">Reminder baru</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Tentukan isi pesan dan periode pengirimannya.
      </p>
      {settings.isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat…</p>
      ) : (
        <ReminderForm
          key={settings.data?.default_timezone ?? "tz"}
          initial={{
            ...emptyReminder,
            timezone: settings.data?.default_timezone ?? emptyReminder.timezone,
          }}
        />
      )}
    </AppShell>
  );
}
