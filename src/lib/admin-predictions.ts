import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { ADMIN_PREDICTIONS_SETUP_SQL } from "@/lib/admin-setup-sql";

type Match = Tables<"matches">;

export type AdminPredictionRow = {
  match_id: string;
  home_score: number;
  away_score: number;
  scorer_name?: string | null;
  bonus_answer?: boolean | null;
};

async function recalculateFinishedMatchPoints(matchIds: string[]) {
  if (matchIds.length === 0) return;

  const { data: matches } = await supabase
    .from("matches")
    .select("id, is_finished, home_score, away_score, bonus_result")
    .in("id", matchIds);

  for (const m of matches ?? []) {
    if (!m.is_finished || m.home_score == null || m.away_score == null) continue;
    await supabase.rpc("calculate_match_points", { match_id_input: m.id });
    if (m.bonus_result != null) {
      await supabase.rpc("calculate_bonus_points", {
        match_id_input: m.id,
        bonus_result_input: m.bonus_result,
      });
    }
  }
}

async function upsertViaTable(
  bolaoId: string,
  targetUserId: string,
  rows: AdminPredictionRow[]
) {
  for (const r of rows) {
    const payload = {
      home_score: r.home_score,
      away_score: r.away_score,
      scorer_name: r.scorer_name || null,
      ...(r.bonus_answer !== undefined ? { bonus_answer: r.bonus_answer } : {}),
    };

    const { data: existing } = await supabase
      .from("predictions")
      .select("id")
      .eq("bolao_id", bolaoId)
      .eq("user_id", targetUserId)
      .eq("match_id", r.match_id)
      .maybeSingle();

    const { error } = existing
      ? await supabase.from("predictions").update(payload).eq("id", existing.id)
      : await supabase.from("predictions").insert({
          bolao_id: bolaoId,
          user_id: targetUserId,
          match_id: r.match_id,
          ...payload,
        });

    if (error) return { error };
  }

  await recalculateFinishedMatchPoints([...new Set(rows.map((r) => r.match_id))]);
  return { error: null };
}

export async function adminUpsertPredictions(
  bolaoId: string,
  targetUserId: string,
  rows: AdminPredictionRow[]
) {
  const { error: rpcError } = await supabase.rpc("admin_upsert_predictions", {
    bolao_id_input: bolaoId,
    target_user_id: targetUserId,
    predictions_input: rows,
  });

  if (!rpcError) return { error: null };

  const rpcMsg = rpcError.message.toLowerCase();
  const rpcMissing =
    rpcMsg.includes("could not find the function") ||
    rpcMsg.includes("schema cache");

  if (!rpcMissing) return { error: rpcError };

  return upsertViaTable(bolaoId, targetUserId, rows);
}

export function adminPredictionErrorMessage(error: { message: string }): string {
  const msg = error.message.toLowerCase();

  if (
    msg.includes("could not find the function") ||
    msg.includes("schema cache") ||
    msg.includes("row-level security") ||
    msg.includes("permission denied") ||
    msg.includes("policy")
  ) {
    return "Banco não configurado. Use o banner vermelho acima: Copiar SQL → Supabase SQL Editor → Run → Verificar.";
  }

  return error.message;
}

export async function copyAdminSetupSql() {
  await navigator.clipboard.writeText(ADMIN_PREDICTIONS_SETUP_SQL);
}

export function buildRoundPredictionRows(
  roundMatches: Match[],
  scores: Record<string, { home: number; away: number }>,
  bonusAnswer?: boolean | null
): AdminPredictionRow[] {
  return roundMatches.map((match) => ({
    match_id: match.id,
    home_score: scores[match.id].home,
    away_score: scores[match.id].away,
    scorer_name: null,
    ...(bonusAnswer !== undefined ? { bonus_answer: bonusAnswer } : {}),
  }));
}
