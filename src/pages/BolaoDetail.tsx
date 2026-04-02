import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Trophy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { getFlag } from "@/lib/country-flags";
import SeasonPredictions from "@/components/SeasonPredictions";
import ScoringRulesModal from "@/components/ScoringRulesModal";

type Match = Tables<"matches">;
type Prediction = Tables<"predictions">;

const BolaoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bolao, setBolao] = useState<Tables<"boloes"> | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [ranking, setRanking] = useState<{ username: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMatch, setSavingMatch] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    const fetchData = async () => {
      const [bolaoRes, matchesRes, predsRes] = await Promise.all([
        supabase.from("boloes").select("*").eq("id", id).single(),
        supabase.from("matches").select("*").order("match_date", { ascending: true }),
        supabase.from("predictions").select("*").eq("bolao_id", id).eq("user_id", user.id),
      ]);
      setBolao(bolaoRes.data);
      setMatches(matchesRes.data || []);

      const predsMap: Record<string, Prediction> = {};
      (predsRes.data || []).forEach((p) => {
        predsMap[p.match_id] = p;
      });
      setPredictions(predsMap);

      // Fetch ranking
      const { data: allPreds } = await supabase
        .from("predictions")
        .select("user_id, points, scorer_points")
        .eq("bolao_id", id);

      const { data: seasonPreds } = await supabase
        .from("season_predictions")
        .select("*")
        .eq("bolao_id", id);

      const totals: Record<string, number> = {};
      (allPreds || []).forEach((p) => {
        totals[p.user_id] = (totals[p.user_id] || 0) + (p.points || 0) + (p.scorer_points || 0);
      });
      (seasonPreds || []).forEach((sp) => {
        totals[sp.user_id] = (totals[sp.user_id] || 0) + (sp.champion_points || 0) + (sp.top_scorer_points || 0) + ((sp as any).best_player_points || 0);
      });

      const userIds = Object.keys(totals);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username")
          .in("user_id", userIds);

        const profileMap: Record<string, string> = {};
        (profiles || []).forEach((p) => {
          profileMap[p.user_id] = p.username;
        });

        const rankingData = userIds
          .map((uid) => ({
            username: profileMap[uid] || "?",
            total: totals[uid],
          }))
          .sort((a, b) => b.total - a.total);

        setRanking(rankingData);
      }

      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  const savePrediction = async (
    matchId: string,
    homeScore: number,
    awayScore: number,
    scorerName: string
  ) => {
    if (!user || !id) return;
    setSavingMatch(matchId);

    const existing = predictions[matchId];
    if (existing) {
      await supabase
        .from("predictions")
        .update({ home_score: homeScore, away_score: awayScore, scorer_name: scorerName || null })
        .eq("id", existing.id);
    } else {
      await supabase.from("predictions").insert({
        bolao_id: id,
        user_id: user.id,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        scorer_name: scorerName || null,
      });
    }

    // Refresh predictions
    const { data } = await supabase
      .from("predictions")
      .select("*")
      .eq("bolao_id", id)
      .eq("user_id", user.id);
    const predsMap: Record<string, Prediction> = {};
    (data || []).forEach((p) => {
      predsMap[p.match_id] = p;
    });
    setPredictions(predsMap);
    setSavingMatch(null);
    toast({ title: "Palpite salvo!" });
  };

  const shareRanking = () => {
    if (!bolao || ranking.length === 0) return;
    const lines = [`🏆 Ranking ${bolao.name}\n`];
    ranking.forEach((r, i) => {
      lines.push(`${i + 1}. ${r.username} - ${r.total}pts`);
    });
    lines.push(`\nParticipe também: https://chute-certo-2026.lovable.app`);
    const text = lines.join("\n");
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareInvite = () => {
    if (!bolao) return;
    const url = `${window.location.origin}/convite/${bolao.invite_code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: "Compartilhe com seus amigos" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!bolao) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Bolão não encontrado</p>
      </div>
    );
  }

  const isMatchLocked = (match: Match) => new Date(match.match_date) <= new Date();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-primary px-4 py-4 text-primary-foreground">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/bolao")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{bolao.name}</h1>
          </div>
          <div className="flex items-center gap-1">
            <ScoringRulesModal />
            <Button
              variant="ghost"
              size="icon"
              onClick={shareInvite}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 p-4">
        <Tabs defaultValue="palpites">
          <TabsList className="w-full">
            <TabsTrigger value="palpites" className="flex-1">Palpites</TabsTrigger>
            <TabsTrigger value="ranking" className="flex-1">Ranking</TabsTrigger>
          </TabsList>

          <TabsContent value="palpites" className="space-y-3 pt-4">
            <SeasonPredictions
              bolaoId={id!}
              userId={user!.id}
              firstMatchDate={matches.length > 0 ? matches[0].match_date : null}
            />
            {matches.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Nenhum jogo cadastrado ainda
              </p>
            ) : (
              matches.map((match) => {
                const pred = predictions[match.id];
                const locked = isMatchLocked(match);
                return (
                  <MatchPredictionCard
                    key={match.id}
                    match={match}
                    prediction={pred}
                    locked={locked}
                    saving={savingMatch === match.id}
                    onSave={savePrediction}
                  />
                );
              })
            )}
          </TabsContent>

          <TabsContent value="ranking" className="pt-4">
            {ranking.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Nenhuma pontuação ainda
              </p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  {ranking.map((r, i) => (
                    <div
                      key={r.username}
                      className="flex items-center justify-between rounded-lg border bg-card p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            i === 0
                              ? "bg-accent text-accent-foreground"
                              : i === 1
                              ? "bg-muted text-muted-foreground"
                              : i === 2
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="font-medium">{r.username}</span>
                      </div>
                      <span className="text-lg font-bold text-accent">{r.total} pts</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full" onClick={shareRanking}>
                  <Share2 className="mr-2 h-4 w-4" /> Compartilhar Ranking no WhatsApp
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Sub-component for match prediction
const MatchPredictionCard = ({
  match,
  prediction,
  locked,
  saving,
  onSave,
}: {
  match: Tables<"matches">;
  prediction?: Tables<"predictions">;
  locked: boolean;
  saving: boolean;
  onSave: (matchId: string, home: number, away: number, scorer: string) => void;
}) => {
  const [homeScore, setHomeScore] = useState(prediction?.home_score?.toString() || "");
  const [awayScore, setAwayScore] = useState(prediction?.away_score?.toString() || "");
  const [scorer, setScorer] = useState(prediction?.scorer_name || "");
  const awayScoreRef = useRef<HTMLInputElement>(null);
  const scorerRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const h = parseInt(homeScore);
    const a = parseInt(awayScore);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    onSave(match.id, h, a, scorer);
  };

  const stageLabels: Record<string, string> = {
    group: "Fase de Grupos",
    round_of_32: "32 avos",
    round_of_16: "Oitavas",
    quarter_final: "Quartas",
    semi_final: "Semifinal",
    third_place: "3º Lugar",
    final: "Final",
  };

  const matchDate = new Date(match.match_date);

  return (
    <Card className={locked ? "opacity-70" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {stageLabels[match.stage] || match.stage}
            {match.group_name && ` • ${match.group_name}`}
          </span>
          <span className="text-xs text-muted-foreground">
            {matchDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            {" "}
            {matchDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}
          </span>
        </div>
        <CardTitle className="text-base">
          <span className="emoji-flag">{getFlag(match.home_team)}</span> {match.home_team} vs {match.away_team} <span className="emoji-flag">{getFlag(match.away_team)}</span>
        </CardTitle>
        {match.is_finished && (
          <p className="text-sm font-bold text-accent">
            Resultado: {match.home_score} × {match.away_score}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {locked ? (
          prediction ? (
            <div className="space-y-1 text-sm">
              <p>
                Seu palpite: <span className="font-bold">{prediction.home_score} × {prediction.away_score}</span>
              </p>
              {prediction.scorer_name && (
                <p>Goleador: <span className="font-medium">{prediction.scorer_name}</span></p>
              )}
              {prediction.points !== null && (
                <p className="font-bold text-accent">+{(prediction.points || 0) + (prediction.scorer_points || 0)} pts</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem palpite (jogo travado)</p>
          )
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="20"
                placeholder="0"
                inputMode="numeric"
                value={homeScore}
                onChange={(e) => {
                  const val = e.target.value;
                  setHomeScore(val);
                  if (val.length >= 1 && /^\d+$/.test(val)) {
                    awayScoreRef.current?.focus();
                    awayScoreRef.current?.select();
                  }
                }}
                className="w-16 text-center"
              />
              <span className="text-sm font-bold">×</span>
              <Input
                ref={awayScoreRef}
                type="number"
                min="0"
                max="20"
                placeholder="0"
                inputMode="numeric"
                value={awayScore}
                onChange={(e) => {
                  const val = e.target.value;
                  setAwayScore(val);
                  if (val.length >= 1 && /^\d+$/.test(val)) {
                    scorerRef.current?.focus();
                  }
                }}
                className="w-16 text-center"
              />
            </div>
            <Input
              ref={scorerRef}
              placeholder="Jogador que marca (opcional)"
              value={scorer}
              onChange={(e) => setScorer(e.target.value)}
            />
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BolaoDetail;
