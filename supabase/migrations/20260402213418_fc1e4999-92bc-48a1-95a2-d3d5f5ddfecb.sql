ALTER TABLE public.season_predictions 
ADD COLUMN best_player text DEFAULT NULL,
ADD COLUMN best_player_points integer DEFAULT 0;