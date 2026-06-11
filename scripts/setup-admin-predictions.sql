-- Cole este script inteiro no Supabase → SQL Editor → Run
-- Habilita palpite retroativo por admin em nome de participantes do bolão

-- 1) Políticas RLS (idempotente)
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

-- 2) Função RPC (ignora prazo e RLS; recalcula pontos se jogo já terminou)
CREATE OR REPLACE FUNCTION public.admin_upsert_predictions(
  bolao_id_input uuid,
  target_user_id uuid,
  predictions_input jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pred jsonb;
  match_id_val uuid;
  m record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.bolao_members
    WHERE bolao_id = bolao_id_input AND user_id = target_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a member of this bolao';
  END IF;

  FOR pred IN SELECT * FROM jsonb_array_elements(predictions_input)
  LOOP
    match_id_val := (pred->>'match_id')::uuid;

    IF NOT EXISTS (SELECT 1 FROM public.matches WHERE id = match_id_val) THEN
      RAISE EXCEPTION 'Match not found: %', match_id_val;
    END IF;

    INSERT INTO public.predictions (
      bolao_id,
      user_id,
      match_id,
      home_score,
      away_score,
      scorer_name,
      bonus_answer
    )
    VALUES (
      bolao_id_input,
      target_user_id,
      match_id_val,
      (pred->>'home_score')::integer,
      (pred->>'away_score')::integer,
      NULLIF(TRIM(pred->>'scorer_name'), ''),
      CASE
        WHEN pred ? 'bonus_answer' AND pred->>'bonus_answer' IS NOT NULL
        THEN (pred->>'bonus_answer')::boolean
        ELSE NULL
      END
    )
    ON CONFLICT (bolao_id, user_id, match_id)
    DO UPDATE SET
      home_score = EXCLUDED.home_score,
      away_score = EXCLUDED.away_score,
      scorer_name = EXCLUDED.scorer_name,
      bonus_answer = EXCLUDED.bonus_answer,
      updated_at = now();

    SELECT home_score, away_score, is_finished, bonus_result
    INTO m
    FROM public.matches
    WHERE id = match_id_val;

    IF m.is_finished AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL THEN
      PERFORM public.calculate_match_points(match_id_val);

      IF m.bonus_result IS NOT NULL THEN
        PERFORM public.calculate_bonus_points(match_id_val, m.bonus_result);
      END IF;
    END IF;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_upsert_predictions(uuid, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_predictions(uuid, uuid, jsonb) TO authenticated;
