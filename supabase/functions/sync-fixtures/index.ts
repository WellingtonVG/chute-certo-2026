import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const APIFOOTBALL_BASE = "https://v3.football.api-sports.io";
const WORLD_CUP_2026_LEAGUE = 1; // FIFA World Cup
const WORLD_CUP_2026_SEASON = 2026;

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    venue: { name: string | null; city: string | null };
    status: { short: string };
  };
  league: { round: string };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
}

function mapStage(round: string): string {
  const r = round.toLowerCase();
  if (r.includes("group")) return "group";
  if (r.includes("32")) return "round_of_32";
  if (r.includes("16") || r.includes("eighth")) return "round_of_16";
  if (r.includes("quarter")) return "quarter_final";
  if (r.includes("semi")) return "semi_final";
  if (r.includes("3rd") || r.includes("third")) return "third_place";
  if (r.includes("final")) return "final";
  return "group";
}

function extractGroup(round: string): string | null {
  const match = round.match(/Group\s+([A-Z])/i);
  return match ? match[1].toUpperCase() : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch from API-Football
    const apiKey = Deno.env.get("APIFOOTBALL_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "APIFOOTBALL_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const url = `${APIFOOTBALL_BASE}/fixtures?league=${WORLD_CUP_2026_LEAGUE}&season=${WORLD_CUP_2026_SEASON}`;
    const apiRes = await fetch(url, {
      headers: { "x-apisports-key": apiKey },
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      return new Response(JSON.stringify({ error: "API-Football error", details: text }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiData = await apiRes.json();
    const fixtures: ApiFixture[] = apiData.response || [];

    if (fixtures.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum jogo encontrado na API", synced: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use service role for upserts
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let synced = 0;
    const finishedStatuses = ["FT", "AET", "PEN"];

    for (const f of fixtures) {
      const isFinished = finishedStatuses.includes(f.fixture.status.short);

      // Check if manually overridden — skip result update if so
      const { data: existing } = await supabaseAdmin
        .from("matches")
        .select("id, is_manual_override")
        .eq("api_football_id", f.fixture.id)
        .maybeSingle();

      const matchData: Record<string, unknown> = {
        api_football_id: f.fixture.id,
        home_team: f.teams.home.name,
        away_team: f.teams.away.name,
        match_date: f.fixture.date,
        stadium: f.fixture.venue.name,
        city: f.fixture.venue.city,
        stage: mapStage(f.league.round),
        group_name: extractGroup(f.league.round),
      };

      // Only update scores if not manually overridden
      if (!existing?.is_manual_override) {
        matchData.home_score = f.goals.home;
        matchData.away_score = f.goals.away;
        matchData.is_finished = isFinished;
      }

      if (existing) {
        await supabaseAdmin.from("matches").update(matchData).eq("id", existing.id);
      } else {
        await supabaseAdmin.from("matches").insert(matchData);
      }
      synced++;
    }

    return new Response(
      JSON.stringify({ message: `${synced} jogos sincronizados`, synced }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
