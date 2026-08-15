CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  default_timezone text NOT NULL DEFAULT 'Asia/Jakarta',
  check_interval_minutes integer NOT NULL DEFAULT 1,
  catchup_hours integer NOT NULL DEFAULT 6,
  scheduler_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read app_settings" ON public.app_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert app_settings" ON public.app_settings
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update app_settings" ON public.app_settings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER app_settings_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (singleton) VALUES (true);

CREATE OR REPLACE FUNCTION public.reschedule_dispatch(_minutes integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, extensions
AS $$
DECLARE
  _schedule text;
  _cmd text;
BEGIN
  IF _minutes IS NULL OR _minutes < 1 OR _minutes > 1440 THEN
    RAISE EXCEPTION 'Interval tidak valid';
  END IF;

  IF _minutes >= 60 AND _minutes % 60 = 0 THEN
    _schedule := '0 */' || (_minutes / 60)::text || ' * * *';
  ELSIF _minutes = 1 THEN
    _schedule := '* * * * *';
  ELSE
    _schedule := '*/' || _minutes::text || ' * * * *';
  END IF;

  SELECT command INTO _cmd FROM cron.job WHERE jobname = 'remindly-dispatch';
  IF _cmd IS NULL THEN
    RETURN 'no-job';
  END IF;

  PERFORM cron.alter_job(
    job_id := (SELECT jobid FROM cron.job WHERE jobname = 'remindly-dispatch'),
    schedule := _schedule
  );
  RETURN _schedule;
END;
$$;

REVOKE ALL ON FUNCTION public.reschedule_dispatch(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.reschedule_dispatch(integer) TO authenticated, service_role;