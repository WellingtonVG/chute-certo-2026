-- Copa 2026: modelo de dados v2 (9 rodadas, round_predictions, match_goals)

CREATE TYPE public.goal_type AS ENUM ('regular', 'own_goal', 'penalty_shootout');

-- Catálogo das 9 rodadas oficiais do bolão
CREATE TABLE IF NOT EXISTS public.competition_rounds (
  round_key text PRIMARY KEY,
  competition text NOT NULL DEFAULT 'copa_do_mundo_2026',
  label text NOT NULL,
  sort_order integer NOT NULL,
  stage public.match_stage,
  base_scorer_points integer NOT NULL DEFAULT 20,
  points_multiplier numeric NOT NULL DEFAULT 1.0
);

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

-- Rodada em cada jogo + flag de prorrogação
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS round_key text REFERENCES public.competition_rounds(round_key),
  ADD COLUMN IF NOT EXISTS score_includes_extra_time boolean NOT NULL DEFAULT true;

-- Gols individuais (para artilheiro da rodada)
CREATE TABLE IF NOT EXISTS public.match_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  team_name text,
  minute integer,
  goal_type public.goal_type NOT NULL DEFAULT 'regular',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_goals_match_id ON public.match_goals(match_id);
CREATE INDEX IF NOT EXISTS idx_match_goals_player_lower ON public.match_goals(lower(player_name));

-- Palpite de artilheiro por rodada (1 por bolão/usuário/rodada)
CREATE TABLE IF NOT EXISTS public.round_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bolao_id uuid NOT NULL REFERENCES public.boloes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round_key text NOT NULL REFERENCES public.competition_rounds(round_key),
  scorer_name text NOT NULL,
  scorer_points integer DEFAULT 0,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bolao_id, user_id, round_key)
);

CREATE INDEX IF NOT EXISTS idx_round_predictions_bolao_user
  ON public.round_predictions(bolao_id, user_id);

-- Backfill round_key nos jogos da Copa (por matchday / fase)
UPDATE public.matches SET round_key = CASE
  WHEN stage = 'group' AND match_date < timestamptz '2026-06-18 16:00:00+00' THEN 'group_1'
  WHEN stage = 'group' AND match_date < timestamptz '2026-06-24 19:00:00+00' THEN 'group_2'
  WHEN stage = 'group' THEN 'group_3'
  WHEN stage = 'round_of_32' THEN 'r32'
  WHEN stage = 'round_of_16' THEN 'r16'
  WHEN stage = 'quarter_final' THEN 'qf'
  WHEN stage = 'semi_final' THEN 'sf'
  WHEN stage = 'third_place' THEN 'third'
  WHEN stage = 'final' THEN 'final'
  ELSE round_key
END
WHERE stage IN ('group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final');

-- Migrar goleadores existentes (predictions.scorer_name) → round_predictions
INSERT INTO public.round_predictions (bolao_id, user_id, round_key, scorer_name, submitted_at)
SELECT DISTINCT ON (p.bolao_id, p.user_id, m.round_key)
  p.bolao_id,
  p.user_id,
  m.round_key,
  p.scorer_name,
  p.created_at
FROM public.predictions p
JOIN public.matches m ON m.id = p.match_id
WHERE p.scorer_name IS NOT NULL
  AND trim(p.scorer_name) <> ''
  AND m.round_key IS NOT NULL
ORDER BY p.bolao_id, p.user_id, m.round_key, p.created_at ASC
ON CONFLICT (bolao_id, user_id, round_key) DO NOTHING;

-- RLS
ALTER TABLE public.competition_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view competition rounds"
  ON public.competition_rounds FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated view match goals"
  ON public.match_goals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage match goals"
  ON public.match_goals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members view round predictions"
  ON public.round_predictions FOR SELECT TO authenticated
  USING (
    bolao_id IN (SELECT public.get_user_bolao_ids())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins manage round predictions"
  ON public.round_predictions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_round_predictions_updated_at
  BEFORE UPDATE ON public.round_predictions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
