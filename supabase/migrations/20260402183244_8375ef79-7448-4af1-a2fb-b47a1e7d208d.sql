
-- Security definer function to get user's bolao IDs without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_bolao_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bolao_id FROM public.bolao_members WHERE user_id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_bolao_ids FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_bolao_ids TO authenticated;

-- Fix bolao_members SELECT policy
DROP POLICY IF EXISTS "Members view bolao members" ON public.bolao_members;
CREATE POLICY "Members view bolao members" ON public.bolao_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR bolao_id IN (SELECT get_user_bolao_ids()) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix boloes SELECT policy
DROP POLICY IF EXISTS "Boloes viewable by members or admin" ON public.boloes;
CREATE POLICY "Boloes viewable by members or admin" ON public.boloes
  FOR SELECT TO authenticated
  USING (id IN (SELECT get_user_bolao_ids()) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix predictions SELECT policy
DROP POLICY IF EXISTS "Members view predictions" ON public.predictions;
CREATE POLICY "Members view predictions" ON public.predictions
  FOR SELECT TO authenticated
  USING (bolao_id IN (SELECT get_user_bolao_ids()) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix season_predictions SELECT policy
DROP POLICY IF EXISTS "Members view season predictions" ON public.season_predictions;
CREATE POLICY "Members view season predictions" ON public.season_predictions
  FOR SELECT TO authenticated
  USING (bolao_id IN (SELECT get_user_bolao_ids()) OR has_role(auth.uid(), 'admin'::app_role));
