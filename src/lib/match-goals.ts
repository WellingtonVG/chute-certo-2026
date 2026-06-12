import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import squads from "@/data/squads.json";

type Match = Tables<"matches">;
type GoalType = Tables<"match_goals">["goal_type"];

export type MatchGoalRow = {
  player_name: string;
  goal_type: GoalType;
};

const squadMap = squads as Record<string, string[]>;

export function getSquadPlayersForMatches(matches: Match[]): string[] {
  const teams = new Set(matches.flatMap((m) => [m.home_team, m.away_team]));
  return [...teams]
    .flatMap((team) => squadMap[team] ?? [])
    .filter((name, i, arr) => arr.indexOf(name) === i)
    .sort((a, b) => a.localeCompare(b));
}

export function findMatchForPlayer(playerName: string, matches: Match[]): Match | null {
  const norm = playerName.trim().toLowerCase();
  for (const match of matches) {
    const players = [
      ...(squadMap[match.home_team] ?? []),
      ...(squadMap[match.away_team] ?? []),
    ];
    if (players.some((p) => p.toLowerCase() === norm)) return match;
  }
  return matches[0] ?? null;
}

export function teamNameForPlayer(playerName: string, match: Match): string | null {
  const norm = playerName.trim().toLowerCase();
  if ((squadMap[match.home_team] ?? []).some((p) => p.toLowerCase() === norm)) {
    return match.home_team;
  }
  if ((squadMap[match.away_team] ?? []).some((p) => p.toLowerCase() === norm)) {
    return match.away_team;
  }
  return null;
}

export async function fetchRegularScorersForRound(
  matchIds: string[]
): Promise<string[]> {
  if (matchIds.length === 0) return [];

  const { data } = await supabase
    .from("match_goals")
    .select("player_name")
    .in("match_id", matchIds)
    .eq("goal_type", "regular");

  const unique = new Set<string>();
  for (const row of data ?? []) {
    const name = row.player_name?.trim();
    if (name) unique.add(name);
  }
  return [...unique].sort((a, b) => a.localeCompare(b));
}

export async function saveRoundRegularScorers(
  roundKey: string,
  matches: Match[],
  playerNames: string[]
) {
  const matchIds = matches.map((m) => m.id);
  if (matchIds.length === 0) return { error: new Error("Nenhum jogo na rodada") };

  const { error: deleteError } = await supabase
    .from("match_goals")
    .delete()
    .in("match_id", matchIds)
    .eq("goal_type", "regular");

  if (deleteError) return { error: deleteError };

  const trimmed = [...new Set(playerNames.map((p) => p.trim()).filter(Boolean))];
  if (trimmed.length > 0) {
    const rows = trimmed.map((player_name) => {
      const match = findMatchForPlayer(player_name, matches);
      if (!match) return null;
      return {
        match_id: match.id,
        player_name,
        goal_type: "regular" as const,
        team_name: teamNameForPlayer(player_name, match),
      };
    }).filter(Boolean);

    const { error: insertError } = await supabase.from("match_goals").insert(rows);
    if (insertError) return { error: insertError };
  }

  await supabase.rpc("sync_competition_rounds_from_matches");

  const { error: pointsError } = await supabase.rpc("calculate_round_scorer_points", {
    round_key_input: roundKey,
  });

  return { error: pointsError };
}
