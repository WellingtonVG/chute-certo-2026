CREATE OR REPLACE FUNCTION public.calculate_bonus_points(match_id_input uuid, bonus_result_input boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.predictions
  SET bonus_points = CASE
    WHEN bonus_answer = bonus_result_input THEN 2
    ELSE -1
  END
  WHERE match_id = match_id_input AND bonus_answer IS NOT NULL;
END;
$$;