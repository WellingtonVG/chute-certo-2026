
-- Function to calculate points for all predictions of a given match
CREATE OR REPLACE FUNCTION public.calculate_match_points(match_id_input uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  m RECORD;
  is_knockout boolean;
  multiplier numeric;
BEGIN
  -- Only admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get match data
  SELECT home_score, away_score, stage, is_finished
  INTO m
  FROM public.matches
  WHERE id = match_id_input;

  IF m.home_score IS NULL OR m.away_score IS NULL THEN
    RETURN;
  END IF;

  -- Determine knockout multiplier
  is_knockout := m.stage IN ('round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final');
  multiplier := CASE WHEN is_knockout THEN 1.5 ELSE 1.0 END;

  -- Update points for all predictions of this match
  UPDATE public.predictions p
  SET points = CEIL(
    CASE
      -- Exact score
      WHEN p.home_score = m.home_score AND p.away_score = m.away_score THEN 5
      -- Correct result + correct goal difference (only when there's a winner)
      WHEN (
        SIGN(p.home_score - p.away_score) = SIGN(m.home_score - m.away_score)
        AND m.home_score <> m.away_score
        AND (p.home_score - p.away_score) = (m.home_score - m.away_score)
      ) THEN 3
      -- Correct result only (win/draw/loss)
      WHEN SIGN(p.home_score - p.away_score) = SIGN(m.home_score - m.away_score) THEN 1
      -- Wrong
      ELSE 0
    END * multiplier
  ),
  scorer_points = CASE
    WHEN p.scorer_name IS NOT NULL AND p.scorer_name <> '' THEN
      CEIL(
        CASE
          -- We don't have actual scorer data, so scorer_points stays as-is if already set by admin
          -- For now, keep existing scorer_points unchanged
          WHEN p.scorer_points IS NOT NULL THEN p.scorer_points
          ELSE 0
        END
      )
    ELSE 0
  END
  WHERE p.match_id = match_id_input;
END;
$$;

-- Enable realtime for predictions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions;
