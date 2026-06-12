-- Mantém competition_rounds e matches.round_key alinhados com o calendário

CREATE OR REPLACE FUNCTION public.sync_competition_rounds_from_matches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.competition_rounds (round_key, label, sort_order, stage, base_scorer_points, points_multiplier)
  SELECT
    day_key,
    'Fase de Grupos — ' || to_char(d::date, 'DD/MM/YYYY'),
    ROW_NUMBER() OVER (ORDER BY d),
    'group',
    20,
    1.0
  FROM (
    SELECT DISTINCT
      to_char(match_date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS d,
      'group_' || to_char(match_date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS day_key
    FROM public.matches
    WHERE stage = 'group'
  ) days
  ON CONFLICT (round_key) DO UPDATE SET
    label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    stage = EXCLUDED.stage,
    base_scorer_points = EXCLUDED.base_scorer_points,
    points_multiplier = EXCLUDED.points_multiplier;

  WITH max_group AS (
    SELECT COALESCE(MAX(sort_order), 0) AS mx
    FROM public.competition_rounds
    WHERE round_key LIKE 'group_%'
  )
  UPDATE public.competition_rounds cr
  SET sort_order = max_group.mx + v.ord
  FROM max_group,
  (VALUES
    ('r32', 1),
    ('r16', 2),
    ('qf', 3),
    ('sf', 4),
    ('third', 5),
    ('final', 6)
  ) AS v(key, ord)
  WHERE cr.round_key = v.key;

  UPDATE public.matches SET round_key = CASE
    WHEN stage = 'group' THEN
      'group_' || to_char(match_date AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
    WHEN stage = 'round_of_32' THEN 'r32'
    WHEN stage = 'round_of_16' THEN 'r16'
    WHEN stage = 'quarter_final' THEN 'qf'
    WHEN stage = 'semi_final' THEN 'sf'
    WHEN stage = 'third_place' THEN 'third'
    WHEN stage = 'final' THEN 'final'
    ELSE round_key
  END
  WHERE stage IN ('group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final');
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_competition_rounds_from_matches() TO authenticated, service_role;

SELECT public.sync_competition_rounds_from_matches();

-- Auto-sincroniza se a rodada ainda não existir (ex.: após sync de jogos)
CREATE OR REPLACE FUNCTION public.calculate_round_scorer_points(round_key_input text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  rp RECORD;
  scored boolean;
  pts integer;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT round_key, base_scorer_points, points_multiplier
  INTO r
  FROM public.competition_rounds
  WHERE round_key = round_key_input;

  IF NOT FOUND THEN
    PERFORM public.sync_competition_rounds_from_matches();

    SELECT round_key, base_scorer_points, points_multiplier
    INTO r
    FROM public.competition_rounds
    WHERE round_key = round_key_input;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Round not found: %', round_key_input;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.round_key = round_key_input
      AND (NOT m.is_finished OR m.home_score IS NULL OR m.away_score IS NULL)
  ) THEN
    RETURN;
  END IF;

  FOR rp IN
    SELECT id, scorer_name
    FROM public.round_predictions
    WHERE round_key = round_key_input
  LOOP
    SELECT EXISTS (
      SELECT 1
      FROM public.match_goals g
      JOIN public.matches m ON m.id = g.match_id
      WHERE m.round_key = round_key_input
        AND lower(trim(g.player_name)) = lower(trim(rp.scorer_name))
        AND g.goal_type = 'regular'
    ) INTO scored;

    pts := CASE WHEN scored THEN (r.base_scorer_points * r.points_multiplier)::integer ELSE 0 END;

    UPDATE public.round_predictions
    SET scorer_points = pts
    WHERE id = rp.id;
  END LOOP;
END;
$$;
