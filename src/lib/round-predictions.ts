import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type RoundPrediction = Tables<"round_predictions">;

export function roundPredictionsMap(
  rows: RoundPrediction[]
): Record<string, RoundPrediction> {
  return Object.fromEntries(rows.map((r) => [r.round_key, r]));
}

export function getUsedScorerNames(
  roundPredictions: Record<string, RoundPrediction>,
  excludeRoundKey?: string
): Set<string> {
  const used = new Set<string>();
  for (const [key, rp] of Object.entries(roundPredictions)) {
    if (key === excludeRoundKey) continue;
    const name = rp.scorer_name?.trim();
    if (name) used.add(name.toLowerCase());
  }
  return used;
}

export function isScorerAlreadyUsed(
  scorerName: string,
  roundPredictions: Record<string, RoundPrediction>,
  excludeRoundKey?: string
): boolean {
  const norm = scorerName.trim().toLowerCase();
  if (!norm) return false;
  return getUsedScorerNames(roundPredictions, excludeRoundKey).has(norm);
}

export async function fetchRoundPredictions(
  bolaoId: string,
  userId: string
): Promise<Record<string, RoundPrediction>> {
  const { data } = await supabase
    .from("round_predictions")
    .select("*")
    .eq("bolao_id", bolaoId)
    .eq("user_id", userId);

  return roundPredictionsMap(data ?? []);
}

export async function upsertRoundPrediction(
  bolaoId: string,
  userId: string,
  roundKey: string,
  scorerName: string
) {
  const trimmed = scorerName.trim();
  if (!trimmed) return { error: null };

  const { data: existing } = await supabase
    .from("round_predictions")
    .select("id")
    .eq("bolao_id", bolaoId)
    .eq("user_id", userId)
    .eq("round_key", roundKey)
    .maybeSingle();

  if (existing) {
    return supabase
      .from("round_predictions")
      .update({ scorer_name: trimmed })
      .eq("id", existing.id);
  }

  return supabase.from("round_predictions").insert({
    bolao_id: bolaoId,
    user_id: userId,
    round_key: roundKey,
    scorer_name: trimmed,
  });
}

export async function fetchFirstCopaMatchDate(): Promise<string | null> {
  const { data } = await supabase
    .from("matches")
    .select("match_date")
    .in("stage", [
      "group",
      "round_of_32",
      "round_of_16",
      "quarter_final",
      "semi_final",
      "third_place",
      "final",
    ])
    .order("match_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.match_date ?? null;
}
