-- Palpites especiais: até 13/06/2026 20h (horário de Brasília)

CREATE OR REPLACE FUNCTION public.is_season_predictions_open()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT now() < timestamptz '2026-06-13 20:00:00-03';
$$;
