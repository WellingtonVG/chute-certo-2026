-- Jogador Revelação + pontuação unificada de 50 pts por palpite especial
ALTER TABLE public.season_predictions
  ADD COLUMN IF NOT EXISTS revelation_player text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS revelation_player_points integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.competition_season_results (
  competition text PRIMARY KEY,
  champion text,
  top_scorer text,
  best_player text,
  revelation_player text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.competition_season_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view season results"
  ON public.competition_season_results
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins manage season results"
  ON public.competition_season_results
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.calculate_season_prediction_points(competition_input text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  results public.competition_season_results%ROWTYPE;
  updated_count integer := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO results FROM public.competition_season_results WHERE competition = competition_input;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Season results not configured for %', competition_input;
  END IF;

  UPDATE public.season_predictions sp
  SET
    champion_points = CASE
      WHEN results.champion IS NOT NULL AND sp.champion IS NOT NULL
        AND lower(trim(sp.champion)) = lower(trim(results.champion)) THEN 50 ELSE 0 END,
    top_scorer_points = CASE
      WHEN results.top_scorer IS NOT NULL AND sp.top_scorer IS NOT NULL
        AND lower(trim(sp.top_scorer)) = lower(trim(results.top_scorer)) THEN 50 ELSE 0 END,
    best_player_points = CASE
      WHEN results.best_player IS NOT NULL AND sp.best_player IS NOT NULL
        AND lower(trim(sp.best_player)) = lower(trim(results.best_player)) THEN 50 ELSE 0 END,
    revelation_player_points = CASE
      WHEN results.revelation_player IS NOT NULL AND sp.revelation_player IS NOT NULL
        AND lower(trim(sp.revelation_player)) = lower(trim(results.revelation_player)) THEN 50 ELSE 0 END
  FROM public.boloes b
  WHERE sp.bolao_id = b.id AND b.competition = competition_input;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.calculate_season_prediction_points(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_season_prediction_points(text) TO authenticated;
