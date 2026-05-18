
CREATE OR REPLACE FUNCTION public.handle_bolao_member_joined()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uname text;
  comp text;
BEGIN
  SELECT competition INTO comp FROM public.boloes WHERE id = NEW.bolao_id;
  IF comp <> 'copa_do_mundo_2026' THEN
    RETURN NEW;
  END IF;

  SELECT username INTO uname FROM public.profiles WHERE user_id = NEW.user_id;
  IF uname IS NULL THEN uname := 'Alguém'; END IF;

  INSERT INTO public.feed_events (bolao_id, user_id, event_type, message)
  VALUES (
    NEW.bolao_id,
    NEW.user_id,
    'joined',
    '👋 ' || uname || ' entrou no bolão!'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_bolao_member_joined ON public.bolao_members;
CREATE TRIGGER on_bolao_member_joined
AFTER INSERT ON public.bolao_members
FOR EACH ROW EXECUTE FUNCTION public.handle_bolao_member_joined();
