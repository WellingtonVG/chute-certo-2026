// sync-results — Mapeia api_football_id e sincroniza resultados + goleadores da Copa 2026
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BASE = "https://api.football-data.org/v4";

const NAME_MAP: Record<string, string> = {
  "EUA": "USA", "Tchéquia": "Czech Republic", "Bósnia e Herzegovina": "Bosnia and Herzegovina",
  "Coreia do Sul": "Korea Republic", "África do Sul": "South Africa", "Holanda": "Netherlands",
  "Alemanha": "Germany", "França": "France", "Espanha": "Spain", "Brasil": "Brazil",
  "Inglaterra": "England", "Japão": "Japan", "Suécia": "Sweden", "Bélgica": "Belgium",
  "Arábia Saudita": "Saudi Arabia", "Marrocos": "Morocco", "Senegal": "Senegal",
  "Uruguai": "Uruguay", "Colômbia": "Colombia", "Croácia": "Croatia", "Equador": "Ecuador",
  "Austrália": "Australia", "Turquia": "Türkiye", "Irã": "Iran", "Noruega": "Norway",
  "Argélia": "Algeria", "Áustria": "Austria", "Jordânia": "Jordan", "Escócia": "Scotland",
  "Panamá": "Panama", "Cabo Verde": "Cape Verde", "Nova Zelândia": "New Zealand",
  "Costa do Marfim": "Côte d'Ivoire", "RD Congo": "DR Congo", "Uzbequistão": "Uzbekistan",
  "Curaçao": "Curaçao", "Paraguai": "Paraguay", "Catar": "Qatar", "Gana": "Ghana",
  "Iraque": "Iraq", "Egito": "Egypt", "Tunísia": "Tunisia", "Haiti": "Haiti",
  "Portugal": "Portugal", "Argentina": "Argentina", "México": "Mexico", "Canadá": "Canada",
};

const norm = (s: string) => s.trim().toLowerCase();
const ptToEn = (pt: string) => NAME_MAP[pt] ?? pt;

async function apiGet(path: string) {
  const key = Deno.env.get("FOOTBALL_DATA_API_KEY")!;
  const res = await fetch(`${BASE}${path}`, { headers: { "X-Auth-Token": key } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`football-data ${path} → ${res.status}: ${txt}`);
  }
  return await res.json();
}

function resolveMatchScore(apiM: any): { home: number; away: number } | null {
  const extra = apiM.score?.extraTime;
  const full = apiM.score?.fullTime;
  const home = extra?.home ?? full?.home;
  const away = extra?.away ?? full?.away;
  if (home === null || home === undefined || away === null || away === undefined) return null;
  return { home, away };
}

function mapGoalType(apiType: string): "regular" | "own_goal" | "penalty_shootout" {
  const t = (apiType || "").toUpperCase();
  if (t.includes("OWN")) return "own_goal";
  if (t.includes("PENALTY")) return "penalty_shootout";
  return "regular";
}

async function syncMatchGoals(supabase: any, matchId: string, apiM: any) {
  let goals: any[] = apiM.goals ?? [];
  if (goals.length === 0 && apiM.id) {
    try {
      const detail = await apiGet(`/matches/${apiM.id}`);
      goals = detail.goals ?? [];
    } catch (e) {
      console.error("match goals fetch err", e);
    }
  }

  await supabase.from("match_goals").delete().eq("match_id", matchId);

  for (const g of goals) {
    const playerName = g.scorer?.name ?? g.player?.name;
    if (!playerName) continue;

    const goalType = mapGoalType(g.type);
    if (goalType === "penalty_shootout") continue;

    const { error } = await supabase.from("match_goals").insert({
      match_id: matchId,
      player_name: playerName,
      team_name: g.team?.name ?? null,
      minute: g.minute ?? null,
      goal_type: goalType,
    });
    if (error) console.error("insert match_goal err", error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!Deno.env.get("FOOTBALL_DATA_API_KEY")) {
      return new Response(JSON.stringify({ error: "FOOTBALL_DATA_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ===== PASSO 1: Mapear api_football_id =====
    console.log("[sync-results] Step 1: mapping api_football_ids");
    const allMatchesData = await apiGet(`/competitions/WC/matches?season=2026`);
    const apiMatches: any[] = allMatchesData.matches ?? [];

    const { data: dbMatches, error: dbErr } = await supabase
      .from("matches")
      .select("id, home_team, away_team, match_date, api_football_id");
    if (dbErr) throw dbErr;

    let mapped = 0;
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    // index API matches by normalized teams
    for (const apiM of apiMatches) {
      const apiHome = norm(apiM.homeTeam?.name ?? "");
      const apiAway = norm(apiM.awayTeam?.name ?? "");
      const apiDate = new Date(apiM.utcDate).getTime();

      const match = dbMatches?.find((db) => {
        const dbHome = norm(ptToEn(db.home_team));
        const dbAway = norm(ptToEn(db.away_team));
        if (dbHome !== apiHome || dbAway !== apiAway) return false;
        const dbDate = new Date(db.match_date).getTime();
        return Math.abs(dbDate - apiDate) <= TWO_HOURS;
      });

      if (match && !match.api_football_id) {
        const { error: upErr } = await supabase
          .from("matches")
          .update({ api_football_id: apiM.id })
          .eq("id", match.id);
        if (upErr) {
          console.error("update api_football_id err", upErr);
        } else {
          mapped++;
          match.api_football_id = apiM.id; // update local cache
        }
      }
    }
    console.log(`[sync-results] mapped=${mapped}`);

    // ===== PASSO 2: Sincronizar resultados =====
    console.log("[sync-results] Step 2: syncing FINISHED matches");
    const finishedData = await apiGet(`/competitions/WC/matches?season=2026&status=FINISHED`);
    const finished: any[] = finishedData.matches ?? [];

    // re-read db state with score/override
    const { data: dbFull, error: dbFullErr } = await supabase
      .from("matches")
      .select("id, api_football_id, home_score, away_score, is_manual_override, home_team, away_team, round_key");
    if (dbFullErr) throw dbFullErr;

    const updatedMatchIds: string[] = [];
    const updatedRoundKeys = new Set<string>();
    let updated = 0;

    for (const apiM of finished) {
      const resolved = resolveMatchScore(apiM);
      if (!resolved) continue;
      const { home: homeScore, away: awayScore } = resolved;

      const dbM = dbFull?.find((m) => m.api_football_id === apiM.id);
      if (!dbM) continue;
      if (dbM.is_manual_override) continue;
      if (dbM.home_score === homeScore && dbM.away_score === awayScore) continue;

      const hasExtraTime = apiM.score?.extraTime?.home != null;

      const { error: upErr } = await supabase
        .from("matches")
        .update({
          home_score: homeScore,
          away_score: awayScore,
          is_finished: true,
          score_includes_extra_time: true,
        })
        .eq("id", dbM.id);
      if (upErr) {
        console.error("update score err", upErr);
        continue;
      }

      await syncMatchGoals(supabase, dbM.id, apiM);

      const { error: rpcErr } = await supabase.rpc("calculate_match_points", { match_id_input: dbM.id });
      if (rpcErr) console.error("calculate_match_points err", rpcErr);

      updatedMatchIds.push(dbM.id);
      if (dbM.round_key) updatedRoundKeys.add(dbM.round_key);
      updated++;
    }
    console.log(`[sync-results] updated=${updated}`);

    // ===== PASSO 3: Artilheiro da rodada =====
    console.log("[sync-results] Step 3: round scorer points");
    let scorers_resolved = 0;
    for (const roundKey of updatedRoundKeys) {
      const { error: roundErr } = await supabase.rpc("calculate_round_scorer_points", {
        round_key_input: roundKey,
      });
      if (roundErr) {
        console.error("calculate_round_scorer_points err", roundErr);
      } else {
        scorers_resolved++;
      }
    }

    // ===== PASSO 4: Generate feed events =====
    console.log("[sync-results] Step 4: invoking generate-feed-events");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    for (const matchId of updatedMatchIds) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/generate-feed-events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
            "apikey": serviceKey,
          },
          body: JSON.stringify({ match_id: matchId }),
        });
        await res.text();
      } catch (e) {
        console.error("generate-feed-events call err", e);
      }
    }

    return new Response(
      JSON.stringify({ mapped, updated, scorers_resolved }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[sync-results] fatal", e);
    return new Response(
      JSON.stringify({ error: String((e as Error).message ?? e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
