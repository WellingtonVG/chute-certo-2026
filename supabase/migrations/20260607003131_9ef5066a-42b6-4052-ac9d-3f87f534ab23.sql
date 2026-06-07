CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-results-every-15min') THEN
    PERFORM cron.unschedule('sync-results-every-15min');
  END IF;
END $$;

SELECT cron.schedule(
  'sync-results-every-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wayngmzajminffglcqak.supabase.co/functions/v1/sync-results',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);