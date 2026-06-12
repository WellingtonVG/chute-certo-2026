import { describe, expect, it } from "vitest";
import { deriveRoundKey } from "@/lib/match-stages";
import { formatMatchDayKey, getRoundLabelFromKey, groupDayRoundKey } from "@/lib/copa-rounds";
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
    is_finished: false,
    ...overrides,
  }) as Match;

describe("group day rounds", () => {
  it("agrupa fase de grupos por dia (BRT)", () => {
    const matches = [
      mkMatch({ id: "1", match_date: "2026-06-11T19:00:00Z" }),
      mkMatch({ id: "2", match_date: "2026-06-12T02:00:00Z" }), // ainda 11/06 em BRT
      mkMatch({ id: "3", match_date: "2026-06-13T19:00:00Z" }),
    ];
    const grouped = groupByRoundKey(matches);
    expect(Object.keys(grouped)).toContain("group_2026-06-11");
    expect(Object.keys(grouped)).toContain("group_2026-06-13");
    expect(grouped["group_2026-06-11"]).toHaveLength(2);
    expect(grouped["group_2026-06-13"]).toHaveLength(1);
  });

  it("ordena dias de grupos antes das eliminatórias", () => {
    const grouped = groupByRoundKey([
      mkMatch({ id: "1", stage: "round_of_32", match_date: "2026-06-28T19:00:00Z", round_key: "r32" }),
      mkMatch({ id: "2", match_date: "2026-06-11T19:00:00Z" }),
    ]);
    const keys = orderedRoundKeys(grouped);
    expect(keys[0]).toBe("group_2026-06-11");
    expect(keys.at(-1)).toBe("r32");
  });

  it("formata label do dia", () => {
    expect(getRoundLabelFromKey("group_2026-06-11")).toContain("Fase de Grupos");
    expect(groupDayRoundKey("2026-06-11T19:00:00Z")).toBe(
      `group_${formatMatchDayKey("2026-06-11T19:00:00Z")}`
    );
  });

  it("migra round_key legado group_1 para dia", () => {
    const m = mkMatch({ round_key: "group_1", match_date: "2026-06-15T19:00:00Z" });
    expect(deriveRoundKey(m)).toBe("group_2026-06-15");
  });
});
