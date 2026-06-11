-- Prazos de palpite: jogos até o kickoff; especiais até 15/06/2026 20h BRT

CREATE OR REPLACE FUNCTION public.is_match_open_for_predictions(match_id_input uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.id = match_id_input
      AND m.match_date > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_season_predictions_open()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT now() < timestamptz '2026-06-15 20:00:00-03';
$$;

DROP POLICY IF EXISTS "Users create predictions" ON public.predictions;
CREATE POLICY "Users create predictions"
ON public.predictions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND bolao_id IN (SELECT public.get_user_bolao_ids())
  AND public.is_match_open_for_predictions(match_id)
);

DROP POLICY IF EXISTS "Users update predictions" ON public.predictions;
CREATE POLICY "Users update predictions"
ON public.predictions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND public.is_match_open_for_predictions(match_id)
)
WITH CHECK (
  auth.uid() = user_id
  AND bolao_id IN (SELECT public.get_user_bolao_ids())
  AND public.is_match_open_for_predictions(match_id)
);

DROP POLICY IF EXISTS "Users create season predictions" ON public.season_predictions;
CREATE POLICY "Users create season predictions"
ON public.season_predictions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND bolao_id IN (SELECT public.get_user_bolao_ids())
  AND public.is_season_predictions_open()
);

DROP POLICY IF EXISTS "Users update season predictions" ON public.season_predictions;
CREATE POLICY "Users update season predictions"
ON public.season_predictions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND public.is_season_predictions_open()
)
WITH CHECK (
  auth.uid() = user_id
  AND bolao_id IN (SELECT public.get_user_bolao_ids())
  AND public.is_season_predictions_open()
);

REVOKE EXECUTE ON FUNCTION public.is_match_open_for_predictions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_match_open_for_predictions(uuid) TO authenticated;
