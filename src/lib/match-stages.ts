import type { Tables } from "@/integrations/supabase/types";
import {
  groupDayRoundKey,
  isGroupDayRoundKey,
  isKnockoutRoundKey,
  KNOCKOUT_ROUND_ORDER,
  getRoundLabelFromKey,
  type KnockoutRoundKey,
} from "@/lib/copa-rounds";

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

/** Brasileirão: agrupa por round_name */
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

/** Deriva round_key: grupos = 1 dia; eliminatórias = fase */
export function deriveRoundKey(match: Match): string | null {
  const rk = (match as Match & { round_key?: string | null }).round_key;
  const stage = match.stage as string;

  if (rk === "group_1" || rk === "group_2" || rk === "group_3") {
    if (stage === "group") return groupDayRoundKey(match.match_date);
  }
  if (rk && (isGroupDayRoundKey(rk) || isKnockoutRoundKey(rk))) return rk;

  if (stage === "group") return groupDayRoundKey(match.match_date);

  const byStage: Record<string, KnockoutRoundKey> = {
    round_of_32: "r32",
    round_of_16: "r16",
    quarter_final: "qf",
    semi_final: "sf",
    third_place: "third",
    final: "final",
  };
  return byStage[stage] ?? null;
}

/** Copa: grupos por dia + eliminatórias por fase */
export function groupByRoundKey(matches: Match[]): Record<string, Match[]> {
  const grouped: Record<string, Match[]> = {};
  for (const m of matches) {
    const key = deriveRoundKey(m);
    if (!key) continue;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  }
  for (const key of Object.keys(grouped)) {
    grouped[key].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    );
  }
  return grouped;
}

/** 1º jogo da rodada (prazo do palpite em lote) */
export function getScorerMatchForRound(roundMatches: Match[]): Match {
  return [...roundMatches].sort(
    (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
  )[0];
}

export function orderedRoundKeys(grouped: Record<string, Match[]>): string[] {
  const groupDays = Object.keys(grouped)
    .filter(isGroupDayRoundKey)
    .sort();
  const knockout = KNOCKOUT_ROUND_ORDER.filter((k) => grouped[k]?.length);
  return [...groupDays, ...knockout];
}

export function getRoundLabel(roundKey: string, _matches?: Match[]): string {
  return getRoundLabelFromKey(roundKey);
}

export function getClosestRoundKey(matches: Match[]): string | null {
  const grouped = groupByRoundKey(matches);
  const keys = orderedRoundKeys(grouped);
  if (keys.length === 0) return null;

  const now = Date.now();
  let best: string | null = null;
  let bestDelta = Infinity;

  for (const key of keys) {
    const earliest = Math.min(
      ...grouped[key].map((m) => new Date(m.match_date).getTime())
    );
    const delta = Math.abs(earliest - now);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = key;
    }
  }
  return best;
}

/** Rodada aberta até o início do primeiro jogo */
export function isRoundOpen(roundMatches: Match[]): boolean {
  if (roundMatches.length === 0) return false;
  const earliest = Math.min(
    ...roundMatches.map((m) => new Date(m.match_date).getTime())
  );
  return earliest > Date.now();
}

export function getRoundScorerName(
  roundKey: string,
  roundPredictions: Record<string, { scorer_name?: string | null }>
): string {
  return roundPredictions[roundKey]?.scorer_name || "";
}
