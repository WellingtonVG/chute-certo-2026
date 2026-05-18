import type { Tables } from "@/integrations/supabase/types";

type Match = Tables<"matches">;

export function groupByRound(matches: Match[]): Record<string, Match[]> {
  const grouped: Record<string, Match[]> = {};
  for (const m of matches) {
    const r = m.round_name || "Sem rodada";
    if (!grouped[r]) grouped[r] = [];
    grouped[r].push(m);
  }
  return grouped;
}

/** Returns round keys ordered by the earliest match_date in each round. */
export function orderedRounds(grouped: Record<string, Match[]>): string[] {
  return Object.entries(grouped)
    .map(([round, ms]) => ({
      round,
      earliest: Math.min(...ms.map((m) => new Date(m.match_date).getTime())),
    }))
    .sort((a, b) => a.earliest - b.earliest)
    .map((x) => x.round);
}

/** Returns the round_name whose matches contain the date closest to now. */
export function getClosestRound(matches: Match[]): string | null {
  if (matches.length === 0) return null;
  const now = Date.now();
  let best: string | null = null;
  let bestDelta = Infinity;
  for (const m of matches) {
    const delta = Math.abs(new Date(m.match_date).getTime() - now);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = m.round_name || "Sem rodada";
    }
  }
  return best;
}
