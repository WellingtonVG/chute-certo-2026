export const SEASON_PREDICTION_POINTS = 50;

export type SeasonPredictionPoints = {
  champion_points?: number | null;
  top_scorer_points?: number | null;
  best_player_points?: number | null;
  revelation_player_points?: number | null;
};

export function getSeasonPointsTotal(sp: SeasonPredictionPoints) {
  return (
    (sp.champion_points || 0) +
    (sp.top_scorer_points || 0) +
    (sp.best_player_points || 0) +
    (sp.revelation_player_points || 0)
  );
}
