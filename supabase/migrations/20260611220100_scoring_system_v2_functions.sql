-- Copa 2026: funções de prazo, pontuação por jogo e artilheiro da rodada

-- Prazo da rodada: até o 1º jogo da rodada
CREATE OR REPLACE FUNCTION public.is_round_open_for_predictions(round_key_input text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT MIN(m.match_date) > now()
     FROM public.matches m
     WHERE m.round_key = round_key_input),
    false
  );
$$;

-- Palpites especiais travam no apito do 1º jogo da Copa
CREATE OR REPLACE FUNCTION public.is_season_predictions_open()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT MIN(m.match_date) > now()
     FROM public.matches m
     WHERE m.stage IN (
       'group', 'round_of_32', 'round_of_16',
       'quarter_final', 'semi_final', 'third_place', 'final'
     )),
    false
  );
$$;

-- Pontuação por jogo: 10 / 7 / 5 / 2 com ×2 a partir das oitavas
CREATE OR REPLACE FUNCTION public.calculate_match_points(match_id_input uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m RECORD;
  multiplier numeric;
  base_points integer;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT home_score, away_score, stage, is_finished
  INTO m
  FROM public.matches
  WHERE id = match_id_input;

  IF m.home_score IS NULL OR m.away_score IS NULL THEN
    RETURN;
  END IF;

  multiplier := CASE
    WHEN m.stage IN ('round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final') THEN 2.0
    ELSE 1.0
  END;

  UPDATE public.predictions p
  SET points = (
    SELECT CASE
      WHEN p.home_score = m.home_score AND p.away_score = m.away_score THEN 10
      WHEN SIGN(p.home_score - p.away_score) = SIGN(m.home_score - m.away_score)
        AND (p.home_score = m.home_score OR p.away_score = m.away_score) THEN 7
      WHEN SIGN(p.home_score - p.away_score) = SIGN(m.home_score - m.away_score) THEN 5
      WHEN p.home_score = m.home_score OR p.away_score = m.away_score THEN 2
      ELSE 0
    END
  ) * multiplier
  WHERE p.match_id = match_id_input;
END;
$$;

-- Artilheiro da rodada: +20 (grupos/R32) ou +40 (oitavas+)
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
    RAISE EXCEPTION 'Round not found: %', round_key_input;
  END IF;

  -- Só pontua quando todos os jogos da rodada terminaram
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

-- Recalcula artilheiro de todas as rodadas com jogos finalizados
CREATE OR REPLACE FUNCTION public.calculate_all_round_scorer_points()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rk text;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  FOR rk IN
    SELECT DISTINCT m.round_key
    FROM public.matches m
    WHERE m.round_key IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.matches m2
        WHERE m2.round_key = m.round_key
          AND (NOT m2.is_finished OR m2.home_score IS NULL)
      )
  LOOP
    PERFORM public.calculate_round_scorer_points(rk);
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_round_open_for_predictions(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_round_open_for_predictions(text) TO authenticated;

DROP POLICY IF EXISTS "Users create round predictions" ON public.round_predictions;
DROP POLICY IF EXISTS "Users update round predictions" ON public.round_predictions;

CREATE POLICY "Users create round predictions"
  ON public.round_predictions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND bolao_id IN (SELECT public.get_user_bolao_ids())
    AND public.is_round_open_for_predictions(round_key)
  );

CREATE POLICY "Users update round predictions"
  ON public.round_predictions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.is_round_open_for_predictions(round_key))
  WITH CHECK (
    auth.uid() = user_id
    AND bolao_id IN (SELECT public.get_user_bolao_ids())
    AND public.is_round_open_for_predictions(round_key)
  );

REVOKE EXECUTE ON FUNCTION public.calculate_round_scorer_points(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_round_scorer_points(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.calculate_all_round_scorer_points() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_all_round_scorer_points() TO authenticated;
