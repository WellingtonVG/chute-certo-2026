-- Fase de grupos: 3 rodadas (1ª, 2ª e 3ª) — 9 rodadas no total do bolão

INSERT INTO public.competition_rounds (round_key, label, sort_order, stage, base_scorer_points, points_multiplier)
VALUES
  ('group_1', 'Fase de Grupos — 1ª rodada', 1, 'group', 20, 1.0),
  ('group_2', 'Fase de Grupos — 2ª rodada', 2, 'group', 20, 1.0),
  ('group_3', 'Fase de Grupos — 3ª rodada', 3, 'group', 20, 1.0)
ON CONFLICT (round_key) DO UPDATE SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  stage = EXCLUDED.stage,
  base_scorer_points = EXCLUDED.base_scorer_points,
  points_multiplier = EXCLUDED.points_multiplier;

WITH ranked AS (
  SELECT
    id,
    'group_' || CEIL(
      ROW_NUMBER() OVER (PARTITION BY group_name ORDER BY match_date)::numeric / 2
    )::int AS new_round_key
  FROM public.matches
  WHERE stage = 'group' AND group_name IS NOT NULL
)
UPDATE public.matches m
SET round_key = r.new_round_key
FROM ranked r
WHERE m.id = r.id;

UPDATE public.matches SET round_key = CASE
  WHEN stage = 'round_of_32' THEN 'r32'
  WHEN stage = 'round_of_16' THEN 'r16'
  WHEN stage = 'quarter_final' THEN 'qf'
  WHEN stage = 'semi_final' THEN 'sf'
  WHEN stage = 'third_place' THEN 'third'
  WHEN stage = 'final' THEN 'final'
  ELSE round_key
END
WHERE stage IN ('round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final');

DELETE FROM public.round_predictions
WHERE round_key ~ '^group_[0-9]{4}-';

DELETE FROM public.competition_rounds
WHERE round_key ~ '^group_[0-9]{4}-';

UPDATE public.competition_rounds SET sort_order = v.ord
FROM (VALUES
  ('group_1', 1),
  ('group_2', 2),
  ('group_3', 3),
  ('r32', 4),
  ('r16', 5),
  ('qf', 6),
  ('sf', 7),
  ('third', 8),
  ('final', 9)
) AS v(key, ord)
WHERE competition_rounds.round_key = v.key;

CREATE OR REPLACE FUNCTION public.sync_competition_rounds_from_matches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.competition_rounds (round_key, label, sort_order, stage, base_scorer_points, points_multiplier)
  VALUES
    ('group_1', 'Fase de Grupos — 1ª rodada', 1, 'group', 20, 1.0),
    ('group_2', 'Fase de Grupos — 2ª rodada', 2, 'group', 20, 1.0),
    ('group_3', 'Fase de Grupos — 3ª rodada', 3, 'group', 20, 1.0),
    ('r32', 'Rodada de 32 (R32)', 4, 'round_of_32', 20, 1.0),
    ('r16', 'Oitavas de Final', 5, 'round_of_16', 20, 2.0),
    ('qf', 'Quartas de Final', 6, 'quarter_final', 20, 2.0),
    ('sf', 'Semifinais', 7, 'semi_final', 20, 2.0),
    ('third', 'Disputa de 3º lugar', 8, 'third_place', 20, 2.0),
    ('final', 'Final', 9, 'final', 20, 2.0)
  ON CONFLICT (round_key) DO UPDATE SET
    label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order,
    stage = EXCLUDED.stage,
    base_scorer_points = EXCLUDED.base_scorer_points,
    points_multiplier = EXCLUDED.points_multiplier;

  WITH ranked AS (
    SELECT
      id,
      'group_' || CEIL(
        ROW_NUMBER() OVER (PARTITION BY group_name ORDER BY match_date)::numeric / 2
      )::int AS new_round_key
    FROM public.matches
    WHERE stage = 'group' AND group_name IS NOT NULL
  )
  UPDATE public.matches m
  SET round_key = r.new_round_key
  FROM ranked r
  WHERE m.id = r.id;

  UPDATE public.matches SET round_key = CASE
    WHEN stage = 'round_of_32' THEN 'r32'
    WHEN stage = 'round_of_16' THEN 'r16'
    WHEN stage = 'quarter_final' THEN 'qf'
    WHEN stage = 'semi_final' THEN 'sf'
    WHEN stage = 'third_place' THEN 'third'
    WHEN stage = 'final' THEN 'final'
    ELSE round_key
  END
  WHERE stage IN ('round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final');
END;
$$;

SELECT public.sync_competition_rounds_from_matches();
