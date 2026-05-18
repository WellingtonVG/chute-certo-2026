CREATE TABLE public.feed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bolao_id uuid NOT NULL REFERENCES public.boloes(id) ON DELETE CASCADE,
  match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  user_id uuid,
  event_type text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feed_events_bolao_created ON public.feed_events (bolao_id, created_at DESC);

ALTER TABLE public.feed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read feed"
ON public.feed_events
FOR SELECT
TO authenticated
USING (
  bolao_id IN (SELECT public.get_user_bolao_ids())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

ALTER TABLE public.feed_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_events;