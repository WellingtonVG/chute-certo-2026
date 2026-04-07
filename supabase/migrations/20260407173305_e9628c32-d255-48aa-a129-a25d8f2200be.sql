
-- Add competition column to boloes
ALTER TABLE public.boloes ADD COLUMN competition text NOT NULL DEFAULT 'copa_do_mundo_2026';

-- Add round_name column to matches (for Brasileirão rounds)
ALTER TABLE public.matches ADD COLUMN round_name text;
