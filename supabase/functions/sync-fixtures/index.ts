// sync-fixtures v4 — Full 104-match schedule
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `You are a sports data provider specializing in FIFA World Cup schedules.

TASK: Return a JSON array with ALL 104 matches of the FIFA World Cup 2026 (June 11 - July 19, 2026).

CRITICAL RULES:
1. The tournament has 48 teams in 12 groups (A through L), 4 teams per group.
2. Group stage: 12 groups × 6 matches = 72 matches. Every group match MUST have real country names, NEVER "TBD" or "Winner of" or placeholders.
3. Knockout stage: 32 matches total (round_of_32: 16, round_of_16: 8, quarter_final: 4, semi_final: 2, third_place: 1, final: 1). Knockout matches can use descriptive placeholders like "Winner Group A" vs "Runner-up Group B".
4. ALL times must be in UTC. The opening match Mexico vs South Africa is on June 11, 2026 at 19:00 UTC (which is 16:00 BRT / local Mexico City time).
5. Use the OFFICIAL FIFA World Cup 2026 schedule with correct venues across USA, Mexico, and Canada.

The 48 qualified teams and their groups:
- Group A: Morocco, Peru, Mexico, South Africa (Mexico, Guadalajara, AT&T Stadium)
- Group B: Belgium, Israel, Paraguay, USA (AT&T Stadium, MetLife, Houston)  
- Group C: Argentina, Egypt, Uzbekistan, Colombia (Hard Rock, MetLife)
- Group D: Japan, Australia, Indonesia, Bahrain (BC Place, Lumen Field)
- Group E: Spain, Bolivia, New Zealand, Turkey (BC Place, BMO Field)
- Group F: France, Panama, Saudi Arabia, Denmark (MetLife, Hard Rock)
- Group G: England, Senegal, Slovenia, Ecuador (SoFi, Lincoln Financial)
- Group H: Portugal, Iran, Ecuador, Cameroon (Lincoln Financial, Mercedes-Benz)
- Group I: Germany, Serbia, Chile, Kenya (NRG Stadium, Mercedes-Benz)
- Group J: Netherlands, Nigeria, Tanzania, South Korea (AT&T, NRG Stadium)
- Group K: Brazil, Costa Rica, Albania, Italy (Rose Bowl, Hard Rock)
- Group L: Croatia, Canada, Ivory Coast, Qatar (BC Place, BMO Field)

Each match object must have exactly these fields:
- "home_team": string (country name in English)
- "away_team": string (country name in English)  
- "match_date": string (ISO 8601 UTC, e.g. "2026-06-11T19:00:00Z")
- "stadium": string (venue name)
- "city": string (host city)
- "stage": one of "group", "round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final"
- "group_name": string or null (e.g. "A" for group stage, null for knockout)

Return ONLY the JSON array. No markdown, no explanation, no code fences.`;

interface AiMatch {
  home_team: string;
  away_team: string;
  match_date: string;
  stadium: string;
  city: string;
  stage: string;
  group_name: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[sync-fixtures] Calling AI Gateway for 104 matches...");

    const aiRes = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: "Return all 104 FIFA World Cup 2026 matches. Group stage: all 72 matches with real team names for all 12 groups (A-L). Knockout: 32 matches. All times in UTC. Opening match Mexico vs South Africa is 2026-06-11T19:00:00Z.",
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.text();
      console.error("[sync-fixtures] AI Gateway error:", aiRes.status, errBody);
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI Gateway error", status: aiRes.status, details: errBody.substring(0, 500) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    console.log("[sync-fixtures] AI response length:", content.length);

    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let matches: AiMatch[];
    try {
      matches = JSON.parse(content);
    } catch (parseErr) {
      console.error("[sync-fixtures] JSON parse error:", String(parseErr), "Preview:", content.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", details: content.substring(0, 500) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(matches) || matches.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum jogo retornado pela IA", synced: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[sync-fixtures] Received", matches.length, "matches from AI");

    // Count TBD matches for logging
    const tbdCount = matches.filter(m => 
      m.home_team?.includes("TBD") || m.away_team?.includes("TBD") ||
      m.home_team?.includes("Winner") || m.away_team?.includes("Winner") ||
      m.home_team?.includes("Runner") || m.away_team?.includes("Runner")
    ).length;
    console.log("[sync-fixtures] Matches with placeholder teams:", tbdCount);

    const validStages = new Set([
      "group", "round_of_32", "round_of_16",
      "quarter_final", "semi_final", "third_place", "final",
    ]);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Delete existing non-manual matches and re-insert for clean sync
    const { error: deleteError } = await supabaseAdmin
      .from("matches")
      .delete()
      .eq("is_manual_override", false);
    
    if (deleteError) {
      console.error("[sync-fixtures] Delete error:", deleteError);
    }

    let synced = 0;
    let skipped = 0;
    const batchRows = [];

    for (const m of matches) {
      if (!m.home_team || !m.away_team || !m.match_date) {
        skipped++;
        continue;
      }

      const stage = validStages.has(m.stage) ? m.stage : "group";

      batchRows.push({
        home_team: m.home_team,
        away_team: m.away_team,
        match_date: m.match_date,
        stadium: m.stadium || null,
        city: m.city || null,
        stage,
        group_name: m.group_name || null,
      });
    }

    // Batch insert in chunks of 50
    for (let i = 0; i < batchRows.length; i += 50) {
      const chunk = batchRows.slice(i, i + 50);
      const { error: insertError } = await supabaseAdmin.from("matches").insert(chunk);
      if (insertError) {
        console.error("[sync-fixtures] Insert error at chunk", i, insertError);
        skipped += chunk.length;
      } else {
        synced += chunk.length;
      }
    }

    console.log("[sync-fixtures] Done:", synced, "synced,", skipped, "skipped, TBD:", tbdCount);

    return new Response(
      JSON.stringify({
        message: `${synced} jogos sincronizados${skipped > 0 ? `, ${skipped} ignorados` : ""}`,
        synced,
        skipped,
        total_from_ai: matches.length,
        tbd_count: tbdCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[sync-fixtures] Internal error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
