CREATE OR REPLACE FUNCTION public.reschedule_dispatch(_minutes integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, extensions
AS $$
DECLARE
  _schedule text;
  _jobid bigint;
BEGIN
  IF _minutes IS NULL OR _minutes < 1 OR _minutes > 1440 THEN
    RAISE EXCEPTION 'Interval tidak valid';
  END IF;

  IF _minutes = 1 THEN
    _schedule := '* * * * *';
  ELSIF _minutes >= 60 AND _minutes % 60 = 0 THEN
    _schedule := '0 */' || (_minutes / 60)::text || ' * * *';
  ELSE
    _schedule := '*/' || _minutes::text || ' * * * *';
  END IF;

  SELECT jobid INTO _jobid FROM cron.job WHERE command LIKE '%/api/public/cron/dispatch%' LIMIT 1;
  IF _jobid IS NULL THEN
    RETURN 'no-job';
  END IF;

  PERFORM cron.alter_job(job_id := _jobid, schedule := _schedule);
  RETURN _schedule;
END;
$$;

REVOKE ALL ON FUNCTION public.reschedule_dispatch(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.reschedule_dispatch(integer) TO authenticated, service_role;