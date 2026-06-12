import { describe, expect, it } from "vitest";
import { buildRanking } from "@/lib/ranking";

describe("buildRanking", () => {
  it("atribui mesma posição em empate", () => {
    const ranking = buildRanking([
      { username: "a", total: 100 },
      { username: "b", total: 100 },
      { username: "c", total: 50 },
    ]);

    expect(ranking[0]).toMatchObject({ username: "a", rank: 1, tied: true });
    expect(ranking[1]).toMatchObject({ username: "b", rank: 1, tied: true });
    expect(ranking[2]).toMatchObject({ username: "c", rank: 3, tied: false });
  });
});
