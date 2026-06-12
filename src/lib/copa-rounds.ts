/** Rodadas oficiais do bolão Copa 2026 — 9 no total */

export const GROUP_ROUND_ORDER = ["group_1", "group_2", "group_3"] as const;

export type GroupRoundKey = (typeof GROUP_ROUND_ORDER)[number];

export const KNOCKOUT_ROUND_ORDER = [
  "r32",
  "r16",
  "qf",
  "sf",
  "third",
  "final",
] as const;

export type KnockoutRoundKey = (typeof KNOCKOUT_ROUND_ORDER)[number];

export type CopaRoundKey = GroupRoundKey | KnockoutRoundKey;

export const COPA_ROUND_ORDER = [...GROUP_ROUND_ORDER, ...KNOCKOUT_ROUND_ORDER] as const;

export const GROUP_ROUND_LABELS: Record<GroupRoundKey, string> = {
  group_1: "Fase de Grupos — 1ª rodada",
  group_2: "Fase de Grupos — 2ª rodada",
  group_3: "Fase de Grupos — 3ª rodada",
};

export const KNOCKOUT_ROUND_LABELS: Record<KnockoutRoundKey, string> = {
  r32: "Rodada de 32 (R32)",
  r16: "Oitavas de Final",
  qf: "Quartas de Final",
  sf: "Semifinais",
  third: "Disputa de 3º lugar",
  final: "Final",
};

export const COPA_ROUND_LABELS: Record<CopaRoundKey, string> = {
  ...GROUP_ROUND_LABELS,
  ...KNOCKOUT_ROUND_LABELS,
};

/** Estágios com multiplicador ×2 nos palpites por jogo */
export const DOUBLED_STAGES = new Set([
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
]);

const DOUBLED_SCORER_ROUNDS = new Set<KnockoutRoundKey>(["r16", "qf", "sf", "third", "final"]);

export function isGroupRoundKey(roundKey: string): roundKey is GroupRoundKey {
  return (GROUP_ROUND_ORDER as readonly string[]).includes(roundKey);
}

export function isKnockoutRoundKey(roundKey: string): roundKey is KnockoutRoundKey {
  return (KNOCKOUT_ROUND_ORDER as readonly string[]).includes(roundKey);
}

export function isCopaRoundKey(roundKey: string): roundKey is CopaRoundKey {
  return isGroupRoundKey(roundKey) || isKnockoutRoundKey(roundKey);
}

export function groupRoundKeyFromMatchday(matchday: 1 | 2 | 3): GroupRoundKey {
  return `group_${matchday}`;
}

type GroupMatchLike = {
  id: string;
  stage: string;
  group_name: string | null;
  match_date: string;
};

/** Cada grupo joga 2 partidas por rodada (1ª, 2ª e 3ª da fase de grupos). */
export function buildGroupRoundKeyMap(matches: GroupMatchLike[]): Map<string, GroupRoundKey> {
  const groupMatches = matches.filter((m) => m.stage === "group" && m.group_name);
  const byGroup: Record<string, GroupMatchLike[]> = {};

  for (const m of groupMatches) {
    const g = m.group_name!;
    if (!byGroup[g]) byGroup[g] = [];
    byGroup[g].push(m);
  }

  const map = new Map<string, GroupRoundKey>();
  for (const group of Object.values(byGroup)) {
    const sorted = [...group].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    );
    sorted.forEach((m, i) => {
      const matchday = Math.min(3, Math.ceil((i + 1) / 2)) as 1 | 2 | 3;
      map.set(m.id, groupRoundKeyFromMatchday(matchday));
    });
  }
  return map;
}

export function getScorerPointsForRound(roundKey: string): number {
  return isKnockoutRoundKey(roundKey) && DOUBLED_SCORER_ROUNDS.has(roundKey) ? 40 : 20;
}

export function isDoubledRound(roundKey: string): boolean {
  return getScorerPointsForRound(roundKey) === 40;
}

export function getRoundLabelFromKey(roundKey: string): string {
  if (isGroupRoundKey(roundKey)) return GROUP_ROUND_LABELS[roundKey];
  if (isKnockoutRoundKey(roundKey)) return KNOCKOUT_ROUND_LABELS[roundKey];
  return roundKey;
}
