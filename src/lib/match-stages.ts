import type { Tables } from "@/integrations/supabase/types";

type Match = Tables<"matches">;

export const STAGE_ORDER = [
  "group",
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
] as const;

export type Stage = (typeof STAGE_ORDER)[number];

export const STAGE_LABELS: Record<string, string> = {
  group: "Fase de Grupos",
  round_of_32: "Rodada de 32",
  round_of_16: "Oitavas de Final",
  quarter_final: "Quartas de Final",
  semi_final: "Semifinais",
  third_place: "Terceiro Lugar",
  final: "Final",
};

export function groupByStage(matches: Match[]): Record<string, Match[]> {
  const grouped: Record<string, Match[]> = {};
  for (const m of matches) {
    const s = m.stage as string;
    if (!grouped[s]) grouped[s] = [];
    grouped[s].push(m);
  }
  return grouped;
}

export function groupByName(matches: Match[]): Record<string, Match[]> {
  const grouped: Record<string, Match[]> = {};
  for (const m of matches) {
    const g = m.group_name || "—";
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(m);
  }
  return grouped;
}

/** Returns the stage whose matches contain the date closest to now. */
export function getClosestStage(matches: Match[]): string | null {
  if (matches.length === 0) return null;
  const now = Date.now();
  let bestStage: string | null = null;
  let bestDelta = Infinity;
  for (const m of matches) {
    const delta = Math.abs(new Date(m.match_date).getTime() - now);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestStage = m.stage as string;
    }
  }
  return bestStage;
}

/** Returns the group_name with the match date closest to now (within `group` stage). */
export function getClosestGroupName(matches: Match[]): string | null {
  const groupMatches = matches.filter((m) => (m.stage as string) === "group");
  if (groupMatches.length === 0) return null;
  const now = Date.now();
  let best: string | null = null;
  let bestDelta = Infinity;
  for (const m of groupMatches) {
    const delta = Math.abs(new Date(m.match_date).getTime() - now);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = m.group_name || "—";
    }
  }
  return best;
}

export function orderedStages(grouped: Record<string, Match[]>): string[] {
  return STAGE_ORDER.filter((s) => grouped[s]?.length);
}
