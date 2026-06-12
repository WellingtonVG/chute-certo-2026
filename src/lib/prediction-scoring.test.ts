import { describe, expect, it } from "vitest";
import { calculateBaseMatchPoints, calculateMatchPoints } from "@/lib/prediction-scoring";

describe("calculateBaseMatchPoints", () => {
  it("10 pts — placar exato", () => {
    expect(calculateBaseMatchPoints({ home: 2, away: 1 }, { home: 2, away: 1 })).toBe(10);
    expect(calculateBaseMatchPoints({ home: 0, away: 0 }, { home: 0, away: 0 })).toBe(10);
  });

  it("7 pts — resultado + gols de um time", () => {
    expect(calculateBaseMatchPoints({ home: 2, away: 1 }, { home: 2, away: 0 })).toBe(7);
    expect(calculateBaseMatchPoints({ home: 1, away: 2 }, { home: 0, away: 2 })).toBe(7);
  });

  it("5 pts — só o resultado", () => {
    expect(calculateBaseMatchPoints({ home: 2, away: 1 }, { home: 3, away: 0 })).toBe(5);
    expect(calculateBaseMatchPoints({ home: 1, away: 1 }, { home: 2, away: 2 })).toBe(5);
  });

  it("2 pts — só gols de um time", () => {
    expect(calculateBaseMatchPoints({ home: 2, away: 0 }, { home: 2, away: 2 })).toBe(2);
    expect(calculateBaseMatchPoints({ home: 1, away: 0 }, { home: 1, away: 1 })).toBe(2);
  });

  it("0 pts — errou tudo", () => {
    expect(calculateBaseMatchPoints({ home: 2, away: 0 }, { home: 0, away: 2 })).toBe(0);
  });
});

describe("calculateMatchPoints multiplier", () => {
  it("×1 na fase de grupos e R32", () => {
    expect(calculateMatchPoints({ home: 2, away: 1 }, { home: 2, away: 1 }, "group")).toBe(10);
    expect(calculateMatchPoints({ home: 2, away: 1 }, { home: 2, away: 1 }, "round_of_32")).toBe(10);
  });

  it("×2 a partir das oitavas", () => {
    expect(calculateMatchPoints({ home: 2, away: 1 }, { home: 2, away: 1 }, "round_of_16")).toBe(20);
    expect(calculateMatchPoints({ home: 1, away: 1 }, { home: 2, away: 2 }, "final")).toBe(10);
  });
});
