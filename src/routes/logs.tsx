import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Filter,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchLogsFiltered, fetchReminders, useServerFn } from "@/lib/app.functions";
import { formatDateTime } from "@/lib/format";

const searchSchema = z.object({
  reminder: z.string().optional(),
});

export const Route = createFileRoute("/logs")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Log Pengiriman Detail — Reminder Mail" },
      {
        name: "description",
        content:
          "Log pengiriman email pengingat dengan filter per reminder, status, dan sumber pemicu, lengkap dengan kode respons SMTP, durasi, dan timestamp.",
      },
      { property: "og:title", content: "Log Pengiriman Detail — Reminder Mail" },
      {
        property: "og:description",
        content: "Telusuri kode respons SMTP, pesan server, durasi, dan waktu tiap pengiriman.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LogsPage,
});

type LogRow = {
  id: string;
  reminder_id: string | null;
  reminder_title: string | null;
  occurrence_at: string | null;
  recipients: string | null;
  status: string;
  error: string | null;
  trigger_source: string;
  sent_at: string;
  smtp_code: number | null;
  smtp_response: string | null;
  smtp_stage: string | null;
  duration_ms: number | null;
};

const SOURCE_LABEL: Record<string, string> = {
  auto: "Otomatis",
  manual: "Manual",
  test: "Uji",
};

const PAGE_SIZE = 50;

function LogsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [status, setStatus] = useState<"all" | "success" | "failed">("all");
  const [source, setSource] = useState<"all" | "auto" | "manual" | "test">("all");
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState(1);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const reminderId = search.reminder ?? "";

  const loadReminders = useServerFn(fetchReminders);
  const loadLogs = useServerFn(fetchLogsFiltered);

  const reminders = useQuery({ queryKey: ["reminders"], queryFn: () => loadReminders() });
  const logs = useQuery({
    queryKey: ["logs", reminderId, status, source, query, pages],
    queryFn: () =>
      loadLogs({
        data: {
          reminderId: reminderId || null,
          status,
          source,
          search: query,
          limit: PAGE_SIZE * pages,
          offset: 0,
        },
      }) as Promise<LogRow[]>,
  });

  const rows = (logs.data ?? []) as LogRow[];
  const filtered = reminderId || status !== "all" || source !== "all" || query;

  function reset() {
    setStatus("all");
    setSource("all");
    setTerm("");
    setQuery("");
    setPages(1);
    void navigate({ search: {} });
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold sm:text-3xl">Log pengiriman</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Detail tiap percobaan kirim: kode respons SMTP, durasi, dan waktu kejadian.
      </p>

      <Card className="mb-4 border-border/70 shadow-[var(--shadow-soft)]">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Reminder</Label>
            <Select
              value={reminderId || "all"}
              onValueChange={(v) => {
                setPages(1);
                void navigate({ search: v === "all" ? {} : { reminder: v } });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua reminder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua reminder</SelectItem>
                {(reminders.data ?? []).map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setPages(1);
                setStatus(v as typeof status);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="success">Berhasil</SelectItem>
                <SelectItem value="failed">Gagal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Sumber</Label>
            <Select
              value={source}
              onValueChange={(v) => {
                setPages(1);
                setSource(v as typeof source);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua sumber</SelectItem>
                <SelectItem value="auto">Otomatis</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="test">Uji</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Cari penerima / judul</Label>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setPages(1);
                setQuery(term);
              }}
            >
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="nama@domain.com"
              />
              <Button type="submit" variant="secondary" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {filtered ? (
            <Button
              variant="ghost"
              size="sm"
              className="justify-self-start rounded-full text-muted-foreground"
              onClick={reset}
            >
              <RotateCcw className="h-4 w-4" /> Bersihkan filter
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {logs.isLoading ? <Skeleton className="h-40 w-full rounded-xl" /> : null}

      <div className="space-y-2">
        {rows.map((l) => {
          const expanded = !!open[l.id];
          return (
            <Card key={l.id} className="border-border/70">
              <CardContent className="p-4">
                <button
                  type="button"
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 text-left"
                  onClick={() => setOpen({ ...open, [l.id]: !expanded })}
                >
                  {l.status === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {l.reminder_title ?? "(tanpa judul)"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.recipients ?? "—"} · {formatDateTime(l.sent_at)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="rounded-full text-[11px]">
                        {SOURCE_LABEL[l.trigger_source] ?? l.trigger_source}
                      </Badge>
                      <Badge
                        variant={l.status === "success" ? "outline" : "destructive"}
                        className="rounded-full text-[11px]"
                      >
                        SMTP {l.smtp_code ?? "—"}
                        {l.smtp_stage ? ` · ${l.smtp_stage}` : ""}
                      </Badge>
                      <Badge variant="outline" className="rounded-full text-[11px]">
                        {l.duration_ms != null ? `${l.duration_ms} ms` : "durasi —"}
                      </Badge>
                    </div>
                  </div>
                  {expanded ? (
                    <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {expanded ? (
                  <div className="mt-3 space-y-2 border-t border-border/60 pt-3 text-xs">
                    <dl className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Waktu kirim</dt>
                        <dd>
                          {new Date(l.sent_at).toISOString()} ({formatDateTime(l.sent_at)})
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Waktu jadwal</dt>
                        <dd>{l.occurrence_at ? formatDateTime(l.occurrence_at) : "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Kode respons SMTP</dt>
                        <dd>{l.smtp_code ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Tahap</dt>
                        <dd>{l.smtp_stage ?? "—"}</dd>
                      </div>
                    </dl>
                    <div>
                      <p className="text-muted-foreground">Respons server</p>
                      <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-2 whitespace-pre-wrap">
                        {l.smtp_response ?? "—"}
                      </pre>
                    </div>
                    {l.error ? (
                      <div>
                        <p className="text-muted-foreground">Pesan error</p>
                        <p className="mt-1 break-words text-destructive">{l.error}</p>
                      </div>
                    ) : null}
                    {l.reminder_id ? (
                      <Link
                        to="/reminders/$id"
                        params={{ id: l.reminder_id }}
                        className="inline-block text-primary underline-offset-4 hover:underline"
                      >
                        Buka reminder
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}

        {!logs.isLoading && rows.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Tidak ada log yang cocok dengan filter.
            </CardContent>
          </Card>
        ) : null}

        {rows.length >= PAGE_SIZE * pages ? (
          <Button
            variant="outline"
            className="w-full rounded-full"
            disabled={logs.isFetching}
            onClick={() => setPages(pages + 1)}
          >
            {logs.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Muat lebih banyak
          </Button>
        ) : null}
      </div>
    </AppShell>
  );
}
