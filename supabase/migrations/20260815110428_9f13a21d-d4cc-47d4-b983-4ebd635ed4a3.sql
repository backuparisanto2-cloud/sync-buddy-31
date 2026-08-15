ALTER TABLE public.send_logs
  ADD COLUMN IF NOT EXISTS smtp_code integer,
  ADD COLUMN IF NOT EXISTS smtp_response text,
  ADD COLUMN IF NOT EXISTS smtp_stage text,
  ADD COLUMN IF NOT EXISTS duration_ms integer;

CREATE INDEX IF NOT EXISTS send_logs_reminder_idx ON public.send_logs(reminder_id, sent_at DESC);