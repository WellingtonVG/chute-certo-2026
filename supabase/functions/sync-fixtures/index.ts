// sync-fixtures v3 — Lovable AI (Gemini)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `You are a sports data provider. Return ONLY a JSON array of all FIFA World Cup 2026 matches.
Each object must have these exact fields:
- "home_team": string (country name in English)
- "away_team": string (country name in English)
- "match_date": string (ISO 8601 datetime in UTC, e.g. "2026-06-11T21:00:00Z")
- "stadium": string (venue name)
- "city": string (host city)
- "stage": one of "group", "round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final"
- "group_name": string or null (e.g. "A", "B", ... only for group stage)

Include ALL matches from the group stage through the final. Use the official FIFA schedule.
Return ONLY the JSON array, no markdown, no explanation.`;

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
    // Auth check
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
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

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[sync-fixtures] Calling Lovable AI Gateway...");

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
            content:
              "Return the complete FIFA World Cup 2026 schedule with all matches. All match times should be in UTC.",
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

    // Strip markdown fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let matches: AiMatch[];
    try {
      matches = JSON.parse(content);
    } catch (parseErr) {
      console.error("[sync-fixtures] JSON parse error:", String(parseErr), "Content preview:", content.substring(0, 500));
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

    // Valid stages
    const validStages = new Set([
      "group", "round_of_32", "round_of_16",
      "quarter_final", "semi_final", "third_place", "final",
    ]);

    // Use service role for upserts
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let synced = 0;
    let skipped = 0;

    for (const m of matches) {
      if (!m.home_team || !m.away_team || !m.match_date) {
        skipped++;
        continue;
      }

      const stage = validStages.has(m.stage) ? m.stage : "group";

      // Check if match already exists (by teams + date)
      const { data: existing } = await supabaseAdmin
        .from("matches")
        .select("id, is_manual_override")
        .eq("home_team", m.home_team)
        .eq("away_team", m.away_team)
        .eq("match_date", m.match_date)
        .maybeSingle();

      const matchData = {
        home_team: m.home_team,
        away_team: m.away_team,
        match_date: m.match_date,
        stadium: m.stadium || null,
        city: m.city || null,
        stage,
        group_name: m.group_name || null,
      };

      if (existing) {
        if (!existing.is_manual_override) {
          await supabaseAdmin.from("matches").update(matchData).eq("id", existing.id);
        }
      } else {
        await supabaseAdmin.from("matches").insert(matchData);
      }
      synced++;
    }

    console.log("[sync-fixtures] Done:", synced, "synced,", skipped, "skipped");

    return new Response(
      JSON.stringify({
        message: `${synced} jogos sincronizados${skipped > 0 ? `, ${skipped} ignorados` : ""}`,
        synced,
        skipped,
        total_from_ai: matches.length,
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
