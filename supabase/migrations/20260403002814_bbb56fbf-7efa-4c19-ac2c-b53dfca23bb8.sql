
-- Quiz rooms for multiplayer
CREATE TABLE public.quiz_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(4), 'hex'),
  created_by uuid NOT NULL,
  level text NOT NULL DEFAULT 'all',
  question_count integer NOT NULL DEFAULT 12,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Quiz participants
CREATE TABLE public.quiz_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.quiz_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL,
  is_ready boolean NOT NULL DEFAULT false,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  finished boolean NOT NULL DEFAULT false,
  time_taken integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

-- Quiz last results per user (only last quiz kept)
CREATE TABLE public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  mode text NOT NULL,
  level text,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  time_taken integer,
  played_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.quiz_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- quiz_rooms: any authenticated user can view and create
CREATE POLICY "Anyone can view quiz rooms" ON public.quiz_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can create quiz rooms" ON public.quiz_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update quiz rooms" ON public.quiz_rooms FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- quiz_participants: anyone can view, join, and update own
CREATE POLICY "Anyone can view participants" ON public.quiz_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users join rooms" ON public.quiz_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own participation" ON public.quiz_participants FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- quiz_results: users manage own results
CREATE POLICY "Users view own results" ON public.quiz_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users upsert own results" ON public.quiz_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own results" ON public.quiz_results FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for multiplayer
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_participants;
