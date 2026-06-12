import { supabase } from "@/integrations/supabase/client";
import type { BolaoMember } from "@/components/AdminPalpiteControl";

export type MatchPredictionPeekEntry = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  homeScore: number | null;
  awayScore: number | null;
  scorerName: string | null;
  bonusAnswer: boolean | null;
  points: number | null;
  scorerPoints: number | null;
  bonusPoints: number | null;
};

export async function fetchMatchPredictionsPeek(
  bolaoId: string,
  matchId: string,
  members: BolaoMember[]
): Promise<MatchPredictionPeekEntry[]> {
  const { data: preds, error } = await supabase
    .from("predictions")
    .select(
      "user_id, home_score, away_score, scorer_name, bonus_answer, points, scorer_points, bonus_points"
    )
    .eq("bolao_id", bolaoId)
    .eq("match_id", matchId);

  if (error) throw error;

  const predByUser = Object.fromEntries((preds || []).map((p) => [p.user_id, p]));

  return members
    .map((m) => {
      const p = predByUser[m.user_id];
      return {
        userId: m.user_id,
        username: m.username,
        avatarUrl: m.avatar_url ?? null,
        homeScore: p?.home_score ?? null,
        awayScore: p?.away_score ?? null,
        scorerName: p?.scorer_name ?? null,
        bonusAnswer: p?.bonus_answer ?? null,
        points: p?.points ?? null,
        scorerPoints: p?.scorer_points ?? null,
        bonusPoints: p?.bonus_points ?? null,
      };
    })
    .sort((a, b) => {
      const aHas = a.homeScore !== null;
      const bHas = b.homeScore !== null;
      if (aHas !== bHas) return aHas ? -1 : 1;
      return a.username.localeCompare(b.username, "pt-BR");
    });
}
