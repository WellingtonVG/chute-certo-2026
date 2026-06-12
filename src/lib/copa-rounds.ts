/** Rodadas eliminatórias fixas do bolão Copa 2026 */

export const KNOCKOUT_ROUND_ORDER = [
  "r32",
  "r16",
  "qf",
  "sf",
  "third",
  "final",
] as const;

export type KnockoutRoundKey = (typeof KNOCKOUT_ROUND_ORDER)[number];

/** Fase de grupos: uma rodada por dia (ex.: group_2026-06-11) */
export type GroupDayRoundKey = `group_${string}`;

export type CopaRoundKey = KnockoutRoundKey | GroupDayRoundKey | string;

export const KNOCKOUT_ROUND_LABELS: Record<KnockoutRoundKey, string> = {
  r32: "Rodada de 32 (R32)",
  r16: "Oitavas de Final",
  qf: "Quartas de Final",
  sf: "Semifinais",
  third: "Disputa de 3º lugar",
  final: "Final",
};

/** @deprecated use orderedRoundKeys — mantido para compat */
export const COPA_ROUND_ORDER = KNOCKOUT_ROUND_ORDER;

export const COPA_ROUND_LABELS = KNOCKOUT_ROUND_LABELS;

export const GROUP_ROUND_PREFIX = "group_";

export const ROUND_TIMEZONE = "America/Sao_Paulo";

/** Estágios com multiplicador ×2 nos palpites por jogo */
export const DOUBLED_STAGES = new Set([
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
]);

const DOUBLED_SCORER_ROUNDS = new Set<KnockoutRoundKey>(["r16", "qf", "sf", "third", "final"]);

export function isGroupDayRoundKey(roundKey: string): boolean {
  return roundKey.startsWith(GROUP_ROUND_PREFIX) && roundKey.length > GROUP_ROUND_PREFIX.length;
}

export function isKnockoutRoundKey(roundKey: string): roundKey is KnockoutRoundKey {
  return (KNOCKOUT_ROUND_ORDER as readonly string[]).includes(roundKey);
}

/** Dia do jogo no fuso da Copa (Brasil) — YYYY-MM-DD */
export function formatMatchDayKey(isoDate: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ROUND_TIMEZONE }).format(new Date(isoDate));
}

export function groupDayRoundKey(isoDate: string): GroupDayRoundKey {
  return `${GROUP_ROUND_PREFIX}${formatMatchDayKey(isoDate)}`;
}

export function getScorerPointsForRound(roundKey: string): number {
  return isKnockoutRoundKey(roundKey) && DOUBLED_SCORER_ROUNDS.has(roundKey) ? 40 : 20;
}

export function isDoubledRound(roundKey: string): boolean {
  return getScorerPointsForRound(roundKey) === 40;
}

export function formatGroupDayLabel(dayKey: string): string {
  const datePart = dayKey.replace(GROUP_ROUND_PREFIX, "");
  const date = new Date(`${datePart}T15:00:00`);
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: ROUND_TIMEZONE,
  });
}

export function getRoundLabelFromKey(roundKey: string): string {
  if (isKnockoutRoundKey(roundKey)) return KNOCKOUT_ROUND_LABELS[roundKey];
  if (isGroupDayRoundKey(roundKey)) {
    return `Fase de Grupos — ${formatGroupDayLabel(roundKey)}`;
  }
  return roundKey;
}
