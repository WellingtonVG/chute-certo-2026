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

export function orderedStages(grouped: Record<string, Match[]>): string[] {
  return STAGE_ORDER.filter((s) => grouped[s]?.length);
}

/** Returns the stage whose matches contain the date closest to now. */
export function getClosestStage(matches: Match[]): string | null {
  if (matches.length === 0) return null;
  const now = Date.now();
  let best: string | null = null;
  let bestDelta = Infinity;
  for (const m of matches) {
    const delta = Math.abs(new Date(m.match_date).getTime() - now);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = m.stage as string;
    }
  }
  return best;
}

/** Returns the group_name (within `group` stage) closest to now. */
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

/** Kept for Brasileirão (round_name) compatibility. */
export function groupByRound(matches: Match[]): Record<string, Match[]> {
  const grouped: Record<string, Match[]> = {};
  for (const m of matches) {
    const r = m.round_name || "Sem rodada";
    if (!grouped[r]) grouped[r] = [];
    grouped[r].push(m);
  }
  return grouped;
}

export function orderedRounds(grouped: Record<string, Match[]>): string[] {
  return Object.entries(grouped)
    .map(([round, ms]) => ({
      round,
      earliest: Math.min(...ms.map((m) => new Date(m.match_date).getTime())),
    }))
    .sort((a, b) => a.earliest - b.earliest)
    .map((x) => x.round);
}

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

const BRT = "America/Sao_Paulo";

/** Chave estável por dia (dd/mm) no fuso de Brasília — cada dia da fase de grupos é uma rodada. */
export function getMatchDayKey(matchDate: string): string {
  return new Date(matchDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: BRT,
  });
}

export function groupByDay(matches: Match[]): Record<string, Match[]> {
  const grouped: Record<string, Match[]> = {};
  for (const m of matches) {
    const day = getMatchDayKey(m.match_date);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(m);
  }
  for (const day of Object.keys(grouped)) {
    grouped[day].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    );
  }
  return grouped;
}

export function orderedDays(grouped: Record<string, Match[]>): string[] {
  return Object.entries(grouped)
    .map(([day, ms]) => ({
      day,
      earliest: Math.min(...ms.map((m) => new Date(m.match_date).getTime())),
    }))
    .sort((a, b) => a.earliest - b.earliest)
    .map((x) => x.day);
}

export function formatDayLabel(dayKey: string, matches: Match[]): string {
  const first = matches[0];
  if (!first) return dayKey;
  const label = new Date(first.match_date).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: BRT,
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getClosestDay(matches: Match[]): string | null {
  if (matches.length === 0) return null;
  const byDay = groupByDay(matches);
  const days = orderedDays(byDay);
  const now = Date.now();
  let best: string | null = null;
  let bestDelta = Infinity;
  for (const day of days) {
    const earliest = Math.min(
      ...byDay[day].map((m) => new Date(m.match_date).getTime())
    );
    const delta = Math.abs(earliest - now);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = day;
    }
  }
  return best;
}

/** Rodada aberta até o início do primeiro jogo do dia. */
export function isRoundOpen(roundMatches: Match[]): boolean {
  if (roundMatches.length === 0) return false;
  const earliest = Math.min(
    ...roundMatches.map((m) => new Date(m.match_date).getTime())
  );
  return earliest > Date.now();
}

/** Goleador da rodada fica no jogo mais cedo (pontuação única por rodada). */
export function getScorerMatchForRound(roundMatches: Match[]): Match {
  return [...roundMatches].sort(
    (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
  )[0];
}

export function getRoundScorerName(
  roundMatches: Match[],
  predictions: Record<string, { scorer_name?: string | null }>
): string {
  const scorerMatch = getScorerMatchForRound(roundMatches);
  return predictions[scorerMatch.id]?.scorer_name || "";
}
