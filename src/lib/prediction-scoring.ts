import { DOUBLED_STAGES } from "@/lib/copa-rounds";

export type ScorePick = { home: number; away: number };
export type ScoreResult = { home: number; away: number };

/** Faixa base 10/7/5/2 — mutuamente exclusiva (maior acerto vale) */
export function calculateBaseMatchPoints(
  pick: ScorePick,
  result: ScoreResult
): number {
  const { home: ph, away: pa } = pick;
  const { home: rh, away: ra } = result;

  if (ph === rh && pa === ra) return 10;

  const pickSign = Math.sign(ph - pa);
  const resultSign = Math.sign(rh - ra);
  const resultCorrect = pickSign === resultSign;

  if (resultCorrect && (ph === rh || pa === ra)) return 7;
  if (resultCorrect) return 5;
  if (ph === rh || pa === ra) return 2;

  return 0;
}

export function getMatchPointsMultiplier(stage: string): number {
  return DOUBLED_STAGES.has(stage) ? 2 : 1;
}

export function calculateMatchPoints(
  pick: ScorePick,
  result: ScoreResult,
  stage: string
): number {
  return calculateBaseMatchPoints(pick, result) * getMatchPointsMultiplier(stage);
}

export const MATCH_POINTS_LABELS: Record<number, string> = {
  10: "Placar exato",
  7: "Resultado + gols de um time",
  5: "Só o resultado",
  2: "Gols de um time",
  0: "Errou",
};

export function describeMatchPoints(basePoints: number): string {
  return MATCH_POINTS_LABELS[basePoints] ?? `${basePoints} pts`;
}
