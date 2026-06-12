-- Artilheiro da rodada: pontua assim que os goleadores forem registrados,
-- sem exigir que todos os jogos da rodada tenham terminado.

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
      AND EXISTS (
        SELECT 1
        FROM public.match_goals g
        JOIN public.matches m2 ON m2.id = g.match_id
        WHERE m2.round_key = m.round_key
          AND g.goal_type = 'regular'
      )
  LOOP
    PERFORM public.calculate_round_scorer_points(rk);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_round_scorer_points(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_all_round_scorer_points() TO service_role;

SELECT public.calculate_all_round_scorer_points();
