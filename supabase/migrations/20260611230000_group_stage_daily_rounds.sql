-- Fase de grupos: cada dia (America/Sao_Paulo) = uma rodada para palpite e artilheiro

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

DELETE FROM public.round_predictions WHERE round_key IN ('group_1', 'group_2', 'group_3');
DELETE FROM public.competition_rounds WHERE round_key IN ('group_1', 'group_2', 'group_3');

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
