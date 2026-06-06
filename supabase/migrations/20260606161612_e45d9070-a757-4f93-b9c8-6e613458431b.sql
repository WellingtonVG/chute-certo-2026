DROP POLICY IF EXISTS "Users create predictions" ON public.predictions;
CREATE POLICY "Users create predictions"
ON public.predictions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND bolao_id IN (SELECT public.get_user_bolao_ids())
);

DROP POLICY IF EXISTS "Users update predictions" ON public.predictions;
CREATE POLICY "Users update predictions"
ON public.predictions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND bolao_id IN (SELECT public.get_user_bolao_ids())
);

DROP POLICY IF EXISTS "Users create season predictions" ON public.season_predictions;
CREATE POLICY "Users create season predictions"
ON public.season_predictions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND bolao_id IN (SELECT public.get_user_bolao_ids())
);

DROP POLICY IF EXISTS "Users update season predictions" ON public.season_predictions;
CREATE POLICY "Users update season predictions"
ON public.season_predictions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND bolao_id IN (SELECT public.get_user_bolao_ids())
);