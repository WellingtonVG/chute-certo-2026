
-- 1) Quiz rooms: tighten SELECT policy
DROP POLICY IF EXISTS "Anyone can view quiz rooms" ON public.quiz_rooms;

CREATE POLICY "Participants and creator view quiz rooms"
ON public.quiz_rooms
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM public.quiz_participants qp
    WHERE qp.room_id = quiz_rooms.id AND qp.user_id = auth.uid()
  )
);

-- RPC to join a quiz room by code atomically (returns room data once joined)
CREATE OR REPLACE FUNCTION public.join_quiz_room(code_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  uname text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO r FROM public.quiz_rooms
  WHERE code = lower(code_input) AND status = 'waiting'
  LIMIT 1;

  IF r.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT username INTO uname FROM public.profiles WHERE user_id = auth.uid();
  IF uname IS NULL THEN uname := 'Jogador'; END IF;

  INSERT INTO public.quiz_participants (room_id, user_id, username)
  VALUES (r.id, auth.uid(), uname)
  ON CONFLICT DO NOTHING;

  RETURN json_build_object(
    'id', r.id,
    'code', r.code,
    'created_by', r.created_by,
    'status', r.status,
    'level', r.level,
    'question_count', r.question_count,
    'questions', r.questions
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.join_quiz_room(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_quiz_room(text) TO authenticated;

-- 2) Revoke execute on internal functions (triggers / policy helpers)
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_bolao_member_joined() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_bolao_ids() FROM PUBLIC, anon, authenticated;

-- 3) Revoke anon execute on client-callable RPCs (keep authenticated)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.lookup_bolao_by_invite(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_match_points(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_bonus_points(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.regenerate_invite_code(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_bolao_by_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_match_points(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_bonus_points(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_invite_code(uuid) TO authenticated;
