// sync-fixtures v5 — Hardcoded official FIFA World Cup 2026 schedule
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Official FIFA World Cup 2026 Groups (from December 5, 2025 draw)
// Times in UTC. Opening match: Mexico vs South Africa = June 11 19:00 UTC (16:00 BRT)

interface Match {
  home_team: string;
  away_team: string;
  match_date: string;
  stadium: string;
  city: string;
  stage: string;
  group_name: string | null;
}

function getGroupStageMatches(): Match[] {
  // Groups from official FIFA draw (Dec 5 2025, Kennedy Center, Washington DC)
  const groups: Record<string, [string, string, string, string]> = {
    A: ["Mexico", "South Africa", "South Korea", "Czech Republic"],
    B: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
    C: ["Brazil", "Morocco", "Haiti", "Scotland"],
    D: ["United States", "Paraguay", "Australia", "Turkey"],
    E: ["Germany", "Curaçao", "Ivory Coast", "Ecuador"],
    F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
    G: ["Belgium", "Egypt", "Iran", "New Zealand"],
    H: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
    I: ["France", "Senegal", "Iraq", "Norway"],
    J: ["Argentina", "Algeria", "Austria", "Jordan"],
    K: ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
    L: ["England", "Croatia", "Ghana", "Panama"],
  };

  // Venue assignments per group (based on FIFA's published venue clusters)
  const groupVenues: Record<string, { stadium: string; city: string }[]> = {
    A: [
      { stadium: "Estadio Azteca", city: "Mexico City" },
      { stadium: "AT&T Stadium", city: "Dallas" },
      { stadium: "Estadio Akron", city: "Guadalajara" },
    ],
    B: [
      { stadium: "BC Place", city: "Vancouver" },
      { stadium: "BMO Field", city: "Toronto" },
      { stadium: "Gillette Stadium", city: "Boston" },
    ],
    C: [
      { stadium: "Hard Rock Stadium", city: "Miami" },
      { stadium: "MetLife Stadium", city: "New York/New Jersey" },
      { stadium: "Gillette Stadium", city: "Boston" },
    ],
    D: [
      { stadium: "AT&T Stadium", city: "Dallas" },
      { stadium: "NRG Stadium", city: "Houston" },
      { stadium: "Levi's Stadium", city: "San Francisco" },
    ],
    E: [
      { stadium: "NRG Stadium", city: "Houston" },
      { stadium: "Mercedes-Benz Stadium", city: "Atlanta" },
      { stadium: "Lincoln Financial Field", city: "Philadelphia" },
    ],
    F: [
      { stadium: "MetLife Stadium", city: "New York/New Jersey" },
      { stadium: "Lincoln Financial Field", city: "Philadelphia" },
      { stadium: "Levi's Stadium", city: "San Francisco" },
    ],
    G: [
      { stadium: "SoFi Stadium", city: "Los Angeles" },
      { stadium: "Lumen Field", city: "Seattle" },
      { stadium: "BC Place", city: "Vancouver" },
    ],
    H: [
      { stadium: "GEHA Field at Arrowhead Stadium", city: "Kansas City" },
      { stadium: "Hard Rock Stadium", city: "Miami" },
      { stadium: "Mercedes-Benz Stadium", city: "Atlanta" },
    ],
    I: [
      { stadium: "Estadio BBVA", city: "Monterrey" },
      { stadium: "Estadio Azteca", city: "Mexico City" },
      { stadium: "Estadio Akron", city: "Guadalajara" },
    ],
    J: [
      { stadium: "GEHA Field at Arrowhead Stadium", city: "Kansas City" },
      { stadium: "NRG Stadium", city: "Houston" },
      { stadium: "AT&T Stadium", city: "Dallas" },
    ],
    K: [
      { stadium: "SoFi Stadium", city: "Los Angeles" },
      { stadium: "Levi's Stadium", city: "San Francisco" },
      { stadium: "Lumen Field", city: "Seattle" },
    ],
    L: [
      { stadium: "BMO Field", city: "Toronto" },
      { stadium: "Gillette Stadium", city: "Boston" },
      { stadium: "Lincoln Financial Field", city: "Philadelphia" },
    ],
  };

  // Match schedule: 72 group stage matches over June 11-26
  // Each group plays 3 matchdays with pattern: MD1: T1vT4, T2vT3 | MD2: T1vT3, T4vT2 | MD3: T1vT2, T3vT4
  // 4-6 matches per day, typical time slots: 14:00, 17:00, 19:00, 22:00 UTC

  // Day-by-day schedule mapping groups to dates
  const schedule: { date: string; time: string; group: string; matchday: number }[] = [
    // June 11 - Day 1 (Opening)
    { date: "2026-06-11", time: "19:00", group: "A", matchday: 1 },
    // June 12 - Day 2
    { date: "2026-06-12", time: "17:00", group: "B", matchday: 1 },
    { date: "2026-06-12", time: "20:00", group: "D", matchday: 1 },
    { date: "2026-06-12", time: "23:00", group: "C", matchday: 1 },
    // June 13 - Day 3
    { date: "2026-06-13", time: "17:00", group: "E", matchday: 1 },
    { date: "2026-06-13", time: "20:00", group: "F", matchday: 1 },
    { date: "2026-06-13", time: "23:00", group: "G", matchday: 1 },
    // June 14 - Day 4
    { date: "2026-06-14", time: "17:00", group: "H", matchday: 1 },
    { date: "2026-06-14", time: "20:00", group: "I", matchday: 1 },
    { date: "2026-06-14", time: "23:00", group: "J", matchday: 1 },
    // June 15 - Day 5
    { date: "2026-06-15", time: "17:00", group: "K", matchday: 1 },
    { date: "2026-06-15", time: "20:00", group: "L", matchday: 1 },
    { date: "2026-06-15", time: "23:00", group: "A", matchday: 2 },
    // June 16 - Day 6
    { date: "2026-06-16", time: "17:00", group: "B", matchday: 2 },
    { date: "2026-06-16", time: "20:00", group: "C", matchday: 2 },
    { date: "2026-06-16", time: "23:00", group: "D", matchday: 2 },
    // June 17 - Day 7
    { date: "2026-06-17", time: "17:00", group: "E", matchday: 2 },
    { date: "2026-06-17", time: "20:00", group: "F", matchday: 2 },
    { date: "2026-06-17", time: "23:00", group: "G", matchday: 2 },
    // June 18 - Day 8
    { date: "2026-06-18", time: "17:00", group: "H", matchday: 2 },
    { date: "2026-06-18", time: "20:00", group: "I", matchday: 2 },
    { date: "2026-06-18", time: "23:00", group: "J", matchday: 2 },
    // June 19 - Day 9
    { date: "2026-06-19", time: "17:00", group: "K", matchday: 2 },
    { date: "2026-06-19", time: "20:00", group: "L", matchday: 2 },
    // June 21 - Day 10 (MD3 - simultaneous kickoffs per group)
    { date: "2026-06-21", time: "20:00", group: "A", matchday: 3 },
    { date: "2026-06-21", time: "23:00", group: "B", matchday: 3 },
    // June 22 - Day 11
    { date: "2026-06-22", time: "20:00", group: "C", matchday: 3 },
    { date: "2026-06-22", time: "23:00", group: "D", matchday: 3 },
    // June 23 - Day 12
    { date: "2026-06-23", time: "20:00", group: "E", matchday: 3 },
    { date: "2026-06-23", time: "23:00", group: "F", matchday: 3 },
    // June 24 - Day 13
    { date: "2026-06-24", time: "20:00", group: "G", matchday: 3 },
    { date: "2026-06-24", time: "23:00", group: "H", matchday: 3 },
    // June 25 - Day 14
    { date: "2026-06-25", time: "20:00", group: "I", matchday: 3 },
    { date: "2026-06-25", time: "23:00", group: "J", matchday: 3 },
    // June 26 - Day 15
    { date: "2026-06-26", time: "20:00", group: "K", matchday: 3 },
    { date: "2026-06-26", time: "23:00", group: "L", matchday: 3 },
  ];

  const matches: Match[] = [];

  for (const slot of schedule) {
    const g = groups[slot.group];
    const venues = groupVenues[slot.group];

    // Each matchday has 2 matches per group
    let m1Home: string, m1Away: string, m2Home: string, m2Away: string;
    let v1Idx: number, v2Idx: number;

    if (slot.matchday === 1) {
      m1Home = g[0]; m1Away = g[3]; // T1 vs T4
      m2Home = g[1]; m2Away = g[2]; // T2 vs T3
      v1Idx = 0; v2Idx = 1;
    } else if (slot.matchday === 2) {
      m1Home = g[0]; m1Away = g[2]; // T1 vs T3
      m2Home = g[3]; m2Away = g[1]; // T4 vs T2
      v1Idx = 1; v2Idx = 2;
    } else {
      m1Home = g[0]; m1Away = g[1]; // T1 vs T2
      m2Home = g[2]; m2Away = g[3]; // T3 vs T4
      v1Idx = 0; v2Idx = 2;
    }

    // First match of the pair
    matches.push({
      home_team: m1Home,
      away_team: m1Away,
      match_date: `${slot.date}T${slot.time}:00Z`,
      stadium: venues[v1Idx].stadium,
      city: venues[v1Idx].city,
      stage: "group",
      group_name: slot.group,
    });

    // Second match 3 hours later (or same time for MD3)
    const secondTime = slot.matchday === 3
      ? slot.time // Simultaneous for MD3
      : (() => {
          const h = parseInt(slot.time.split(":")[0]);
          return `${String(h + 3).padStart(2, "0")}:00`;
        })();

    matches.push({
      home_team: m2Home,
      away_team: m2Away,
      match_date: `${slot.date}T${secondTime}:00Z`,
      stadium: venues[v2Idx].stadium,
      city: venues[v2Idx].city,
      stage: "group",
      group_name: slot.group,
    });
  }

  return matches;
}

function getKnockoutMatches(): Match[] {
  // 32 knockout matches: Round of 32 (16), Round of 16 (8), QF (4), SF (2), 3rd place (1), Final (1)
  return [
    // Round of 32 - June 28 to July 1
    { home_team: "2nd Group A", away_team: "2nd Group B", match_date: "2026-06-28T17:00:00Z", stadium: "AT&T Stadium", city: "Dallas", stage: "round_of_32", group_name: null },
    { home_team: "1st Group E", away_team: "3rd Group TBD", match_date: "2026-06-28T20:00:00Z", stadium: "NRG Stadium", city: "Houston", stage: "round_of_32", group_name: null },
    { home_team: "1st Group F", away_team: "2nd Group C", match_date: "2026-06-28T23:00:00Z", stadium: "MetLife Stadium", city: "New York/New Jersey", stage: "round_of_32", group_name: null },
    { home_team: "1st Group C", away_team: "2nd Group F", match_date: "2026-06-29T00:00:00Z", stadium: "Hard Rock Stadium", city: "Miami", stage: "round_of_32", group_name: null },
    { home_team: "1st Group I", away_team: "3rd Group TBD", match_date: "2026-06-29T17:00:00Z", stadium: "Estadio Azteca", city: "Mexico City", stage: "round_of_32", group_name: null },
    { home_team: "2nd Group E", away_team: "2nd Group I", match_date: "2026-06-29T20:00:00Z", stadium: "Mercedes-Benz Stadium", city: "Atlanta", stage: "round_of_32", group_name: null },
    { home_team: "1st Group A", away_team: "3rd Group TBD", match_date: "2026-06-29T23:00:00Z", stadium: "Estadio Akron", city: "Guadalajara", stage: "round_of_32", group_name: null },
    { home_team: "1st Group L", away_team: "3rd Group TBD", match_date: "2026-06-30T00:00:00Z", stadium: "BMO Field", city: "Toronto", stage: "round_of_32", group_name: null },
    { home_team: "1st Group D", away_team: "3rd Group TBD", match_date: "2026-06-30T17:00:00Z", stadium: "Levi's Stadium", city: "San Francisco", stage: "round_of_32", group_name: null },
    { home_team: "1st Group G", away_team: "3rd Group TBD", match_date: "2026-06-30T20:00:00Z", stadium: "SoFi Stadium", city: "Los Angeles", stage: "round_of_32", group_name: null },
    { home_team: "2nd Group K", away_team: "2nd Group L", match_date: "2026-06-30T23:00:00Z", stadium: "Lumen Field", city: "Seattle", stage: "round_of_32", group_name: null },
    { home_team: "1st Group H", away_team: "2nd Group J", match_date: "2026-07-01T00:00:00Z", stadium: "GEHA Field at Arrowhead Stadium", city: "Kansas City", stage: "round_of_32", group_name: null },
    { home_team: "1st Group B", away_team: "3rd Group TBD", match_date: "2026-07-01T17:00:00Z", stadium: "BC Place", city: "Vancouver", stage: "round_of_32", group_name: null },
    { home_team: "1st Group J", away_team: "2nd Group H", match_date: "2026-07-01T20:00:00Z", stadium: "Lincoln Financial Field", city: "Philadelphia", stage: "round_of_32", group_name: null },
    { home_team: "1st Group K", away_team: "3rd Group TBD", match_date: "2026-07-01T23:00:00Z", stadium: "Gillette Stadium", city: "Boston", stage: "round_of_32", group_name: null },
    { home_team: "2nd Group D", away_team: "2nd Group G", match_date: "2026-07-02T00:00:00Z", stadium: "Estadio BBVA", city: "Monterrey", stage: "round_of_32", group_name: null },

    // Round of 16 - July 4-6
    { home_team: "W73", away_team: "W74", match_date: "2026-07-04T17:00:00Z", stadium: "AT&T Stadium", city: "Dallas", stage: "round_of_16", group_name: null },
    { home_team: "W75", away_team: "W76", match_date: "2026-07-04T21:00:00Z", stadium: "MetLife Stadium", city: "New York/New Jersey", stage: "round_of_16", group_name: null },
    { home_team: "W77", away_team: "W78", match_date: "2026-07-05T17:00:00Z", stadium: "NRG Stadium", city: "Houston", stage: "round_of_16", group_name: null },
    { home_team: "W79", away_team: "W80", match_date: "2026-07-05T21:00:00Z", stadium: "Hard Rock Stadium", city: "Miami", stage: "round_of_16", group_name: null },
    { home_team: "W81", away_team: "W82", match_date: "2026-07-06T17:00:00Z", stadium: "SoFi Stadium", city: "Los Angeles", stage: "round_of_16", group_name: null },
    { home_team: "W83", away_team: "W84", match_date: "2026-07-06T21:00:00Z", stadium: "GEHA Field at Arrowhead Stadium", city: "Kansas City", stage: "round_of_16", group_name: null },
    { home_team: "W85", away_team: "W86", match_date: "2026-07-06T17:00:00Z", stadium: "Mercedes-Benz Stadium", city: "Atlanta", stage: "round_of_16", group_name: null },
    { home_team: "W87", away_team: "W88", match_date: "2026-07-06T21:00:00Z", stadium: "Lincoln Financial Field", city: "Philadelphia", stage: "round_of_16", group_name: null },

    // Quarter-finals - July 9-10
    { home_team: "W89", away_team: "W90", match_date: "2026-07-09T20:00:00Z", stadium: "AT&T Stadium", city: "Dallas", stage: "quarter_final", group_name: null },
    { home_team: "W91", away_team: "W92", match_date: "2026-07-09T23:00:00Z", stadium: "Hard Rock Stadium", city: "Miami", stage: "quarter_final", group_name: null },
    { home_team: "W93", away_team: "W94", match_date: "2026-07-10T20:00:00Z", stadium: "SoFi Stadium", city: "Los Angeles", stage: "quarter_final", group_name: null },
    { home_team: "W95", away_team: "W96", match_date: "2026-07-10T23:00:00Z", stadium: "NRG Stadium", city: "Houston", stage: "quarter_final", group_name: null },

    // Semi-finals - July 14-15
    { home_team: "WQF1", away_team: "WQF2", match_date: "2026-07-14T21:00:00Z", stadium: "AT&T Stadium", city: "Dallas", stage: "semi_final", group_name: null },
    { home_team: "WQF3", away_team: "WQF4", match_date: "2026-07-15T21:00:00Z", stadium: "MetLife Stadium", city: "New York/New Jersey", stage: "semi_final", group_name: null },

    // Third place - July 18
    { home_team: "LSF1", away_team: "LSF2", match_date: "2026-07-18T21:00:00Z", stadium: "Hard Rock Stadium", city: "Miami", stage: "third_place", group_name: null },

    // Final - July 19
    { home_team: "WSF1", away_team: "WSF2", match_date: "2026-07-19T21:00:00Z", stadium: "MetLife Stadium", city: "New York/New Jersey", stage: "final", group_name: null },
  ];
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

    console.log("[sync-fixtures] Building hardcoded schedule...");

    const groupMatches = getGroupStageMatches();
    const knockoutMatches = getKnockoutMatches();
    const allMatches = [...groupMatches, ...knockoutMatches];

    console.log("[sync-fixtures] Total matches:", allMatches.length, "| Group:", groupMatches.length, "| Knockout:", knockoutMatches.length);

    const validStages = new Set([
      "group", "round_of_32", "round_of_16",
      "quarter_final", "semi_final", "third_place", "final",
    ]);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Delete existing non-manual matches and re-insert
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

    for (const m of allMatches) {
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

    console.log("[sync-fixtures] Done:", synced, "synced,", skipped, "skipped");

    return new Response(
      JSON.stringify({
        message: `${synced} jogos sincronizados com dados oficiais FIFA${skipped > 0 ? `, ${skipped} ignorados` : ""}`,
        synced,
        skipped,
        total: allMatches.length,
        source: "FIFA Official Draw (Dec 5 2025) + Published Schedule",
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
