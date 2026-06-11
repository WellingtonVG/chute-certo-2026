-- Admins podem registrar palpites retroativos para membros do bolão (ignora prazo)

DROP POLICY IF EXISTS "Admins create predictions for members" ON public.predictions;
DROP POLICY IF EXISTS "Admins update predictions for members" ON public.predictions;

CREATE POLICY "Admins create predictions for members"
ON public.predictions
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.bolao_members bm
    WHERE bm.bolao_id = predictions.bolao_id
      AND bm.user_id = predictions.user_id
  )
);

CREATE POLICY "Admins update predictions for members"
ON public.predictions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.bolao_members bm
    WHERE bm.bolao_id = predictions.bolao_id
      AND bm.user_id = predictions.user_id
  )
);
