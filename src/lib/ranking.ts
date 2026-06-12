export type RankingEntry = {
  username: string;
  total: number;
  rank: number;
  tied: boolean;
};

/** Empate na pontuação: mesma posição, sem desempate */
export function buildRanking(
  entries: { username: string; total: number }[]
): RankingEntry[] {
  const sorted = [...entries].sort((a, b) => b.total - a.total);
  let rank = 1;

  return sorted.map((entry, i) => {
    if (i > 0 && sorted[i - 1].total !== entry.total) {
      rank = i + 1;
    }
    const tied =
      (i > 0 && sorted[i - 1].total === entry.total) ||
      (i < sorted.length - 1 && sorted[i + 1].total === entry.total);

    return { ...entry, rank, tied };
  });
}
