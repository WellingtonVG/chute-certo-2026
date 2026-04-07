
-- Add bonus_question to matches (stores the question text, null = no bonus)
ALTER TABLE public.matches ADD COLUMN bonus_question text;

-- Add bonus columns to predictions
ALTER TABLE public.predictions ADD COLUMN bonus_answer boolean;
ALTER TABLE public.predictions ADD COLUMN bonus_points integer DEFAULT 0;

-- Add bonus_result to matches (admin sets the actual answer)
ALTER TABLE public.matches ADD COLUMN bonus_result boolean;
