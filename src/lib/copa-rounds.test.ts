import { describe, expect, it } from "vitest";
import {
  buildGroupRoundKeyMap,
  getRoundLabelFromKey,
  getScorerPointsForRound,
} from "@/lib/copa-rounds";
import { deriveRoundKey, groupByRoundKey, orderedRoundKeys } from "@/lib/match-stages";
import type { Tables } from "@/integrations/supabase/types";

type Match = Tables<"matches">;

const mkMatch = (overrides: Partial<Match>): Match =>
  ({
    id: "1",
    home_team: "A",
    away_team: "B",
    match_date: "2026-06-11T19:00:00Z",
    stage: "group",
    group_name: "A",
    is_finished: false,
    ...overrides,
  }) as Match;

describe("group stage rounds", () => {
  it("agrupa fase de grupos em 3 rodadas por grupo", () => {
    const matches = [
      mkMatch({ id: "a1", group_name: "A", match_date: "2026-06-11T19:00:00Z" }),
      mkMatch({ id: "a2", group_name: "A", match_date: "2026-06-12T02:00:00Z" }),
      mkMatch({ id: "a3", group_name: "A", match_date: "2026-06-18T16:00:00Z" }),
      mkMatch({ id: "a4", group_name: "A", match_date: "2026-06-19T01:00:00Z" }),
      mkMatch({ id: "a5", group_name: "A", match_date: "2026-06-25T01:00:00Z" }),
      mkMatch({ id: "a6", group_name: "A", match_date: "2026-06-25T01:30:00Z" }),
      mkMatch({ id: "b1", group_name: "B", match_date: "2026-06-12T19:00:00Z" }),
      mkMatch({ id: "b2", group_name: "B", match_date: "2026-06-13T19:00:00Z" }),
    ];

    const grouped = groupByRoundKey(matches);
    const map = buildGroupRoundKeyMap(matches);
    expect(grouped.group_1).toHaveLength(4);
    expect(grouped.group_2).toHaveLength(2);
    expect(grouped.group_3).toHaveLength(2);
    expect(deriveRoundKey(matches[0], map)).toBe("group_1");
    expect(deriveRoundKey(matches[2], map)).toBe("group_2");
    expect(deriveRoundKey(matches[4], map)).toBe("group_3");
  });

  it("ordena 3 rodadas de grupos antes das eliminatórias", () => {
    const grouped = groupByRoundKey([
      mkMatch({ id: "1", stage: "round_of_32", match_date: "2026-06-28T19:00:00Z", round_key: "r32" }),
      mkMatch({ id: "2", group_name: "A", match_date: "2026-06-11T19:00:00Z" }),
      mkMatch({ id: "3", group_name: "A", match_date: "2026-06-12T02:00:00Z" }),
      mkMatch({ id: "4", group_name: "A", match_date: "2026-06-18T16:00:00Z" }),
      mkMatch({ id: "5", group_name: "A", match_date: "2026-06-19T01:00:00Z" }),
    ]);
    const keys = orderedRoundKeys(grouped);
    expect(keys).toEqual(["group_1", "group_2", "r32"]);
  });

  it("formata labels e pontuação do artilheiro", () => {
    expect(getRoundLabelFromKey("group_1")).toBe("Fase de Grupos — 1ª rodada");
    expect(getRoundLabelFromKey("group_3")).toContain("3ª rodada");
    expect(getScorerPointsForRound("group_1")).toBe(20);
    expect(getScorerPointsForRound("r32")).toBe(20);
    expect(getScorerPointsForRound("r16")).toBe(40);
    expect(getScorerPointsForRound("final")).toBe(40);
  });

  it("usa round_key do banco quando já definido", () => {
    const m = mkMatch({ round_key: "group_2", match_date: "2026-06-11T19:00:00Z" });
    expect(deriveRoundKey(m)).toBe("group_2");
  });
});
