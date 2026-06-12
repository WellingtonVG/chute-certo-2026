-- Bolão único: todos os usuários entram automaticamente

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );

  INSERT INTO public.bolao_members (bolao_id, user_id)
  VALUES ('28c969e4-c231-47f6-b3a9-23cc2231f21c', NEW.id)
  ON CONFLICT (bolao_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

INSERT INTO public.bolao_members (bolao_id, user_id)
SELECT '28c969e4-c231-47f6-b3a9-23cc2231f21c', p.user_id
FROM public.profiles p
ON CONFLICT (bolao_id, user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.ensure_default_bolao_membership()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.bolao_members (bolao_id, user_id)
  VALUES ('28c969e4-c231-47f6-b3a9-23cc2231f21c', auth.uid())
  ON CONFLICT (bolao_id, user_id) DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_default_bolao_membership() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_default_bolao_membership() TO authenticated;
