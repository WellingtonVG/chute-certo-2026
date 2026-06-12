import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminPalpiteControl, { type BolaoMember } from "@/components/AdminPalpiteControl";
import { UserAvatar } from "@/components/UserAvatar";
import AdminSetupBanner from "@/components/AdminSetupBanner";
import { adminUpsertPredictions, adminPredictionErrorMessage, buildRoundPredictionRows } from "@/lib/admin-predictions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, Trophy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { getSeasonPointsTotal } from "@/lib/season-predictions";
import { MatchTeamsDisplay } from "@/components/CountryFlag";
import {
  formatDeadline,
  formatMatchDateTime,
  isMatchPredictionOpen,
  isMatchToday,
  matchTodayHighlightClass,
} from "@/lib/prediction-deadlines";
import { cn } from "@/lib/utils";
import SeasonPredictions from "@/components/SeasonPredictions";
import ScoringRulesModal from "@/components/ScoringRulesModal";
import BolaoFeed from "@/components/BolaoFeed";
import {
  getClosestRound,
  groupByRound,
  orderedRounds,
  groupByRoundKey,
  orderedRoundKeys,
  getClosestRoundKey,
  isRoundOpen,
} from "@/lib/match-stages";
import { getRoundLabelFromKey } from "@/lib/copa-rounds";
import {
  fetchRoundPredictions,
  getUsedScorerNames,
  isScorerAlreadyUsed,
  upsertRoundPrediction,
  type RoundPrediction,
} from "@/lib/round-predictions";
import { buildRanking, type RankingEntry } from "@/lib/ranking";
import squads from "@/data/squads.json";
import RoundPredictionPanel from "@/components/RoundPredictionPanel";
import MemberPredictionsSelector from "@/components/MemberPredictionsSelector";
import { PageHeader } from "@/components/PageHeader";
import { ThemeCornerButton } from "@/components/ThemeToggle";
import { APP_PUBLIC_URL, DEFAULT_BOLAO_ID, DEFAULT_BOLAO_PATH } from "@/lib/bolao-config";

type Match = Tables<"matches">;
type Prediction = Tables<"predictions">;

const BolaoDetail = () => {
  const { id: routeId } = useParams<{ id: string }>();
  const bolaoId = DEFAULT_BOLAO_ID;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [bolao, setBolao] = useState<Tables<"boloes"> | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [adminPredictions, setAdminPredictions] = useState<Record<string, Prediction>>({});
  const [bolaoMembers, setBolaoMembers] = useState<BolaoMember[]>([]);
  const [adminTargetUserId, setAdminTargetUserId] = useState<string | null>(null);
  const [adminTargetUsername, setAdminTargetUsername] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [roundPredictions, setRoundPredictions] = useState<Record<string, RoundPrediction>>({});
  const [adminRoundPredictions, setAdminRoundPredictions] = useState<Record<string, RoundPrediction>>({});
  const [loading, setLoading] = useState(true);
  const [savingMatch, setSavingMatch] = useState<string | null>(null);
  const [savingRound, setSavingRound] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const isAdminPalpiteMode = !!adminTargetUserId;
  const isViewingSelf = !!user && selectedUserId === user.id;
  const readOnlyView = !isAdminPalpiteMode && !isViewingSelf;
  const activePredictions = isAdminPalpiteMode ? adminPredictions : predictions;
  const activeRoundPredictions = isAdminPalpiteMode ? adminRoundPredictions : roundPredictions;
  const displayUserId = isAdminPalpiteMode ? adminTargetUserId! : selectedUserId ?? user!.id;

  useEffect(() => {
    if (routeId && routeId !== DEFAULT_BOLAO_ID) {
      navigate(`${DEFAULT_BOLAO_PATH}${window.location.search}`, { replace: true });
    }
  }, [routeId, navigate]);

  const fetchRanking = async (rankingBolaoId: string, competition: string) => {
    const [{ data: allPreds }, { data: roundPreds }] = await Promise.all([
      supabase
        .from("predictions")
        .select("user_id, points, bonus_points")
        .eq("bolao_id", rankingBolaoId),
      competition !== "brasileirao_2026"
        ? supabase
            .from("round_predictions")
            .select("user_id, scorer_points")
            .eq("bolao_id", rankingBolaoId)
        : Promise.resolve({ data: [] as { user_id: string; scorer_points: number | null }[] }),
    ]);

    const totals: Record<string, number> = {};
    (allPreds || []).forEach((p) => {
      totals[p.user_id] = (totals[p.user_id] || 0) + (p.points || 0) + (p.bonus_points || 0);
    });
    (roundPreds || []).forEach((rp) => {
      totals[rp.user_id] = (totals[rp.user_id] || 0) + (rp.scorer_points || 0);
    });

    // Season predictions only for Copa
    if (competition !== "brasileirao_2026") {
      const { data: seasonPreds } = await supabase
        .from("season_predictions")
        .select("*")
        .eq("bolao_id", rankingBolaoId);

      (seasonPreds || []).forEach((sp) => {
        totals[sp.user_id] = (totals[sp.user_id] || 0) + getSeasonPointsTotal(sp);
      });
    }

    const userIds = Object.keys(totals);
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

      const profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
      (profiles || []).forEach((p) => {
        profileMap[p.user_id] = { username: p.username, avatar_url: p.avatar_url };
      });

      setRanking(
        buildRanking(
          userIds.map((uid) => ({
            username: profileMap[uid]?.username || "?",
            avatarUrl: profileMap[uid]?.avatar_url,
            total: totals[uid],
          }))
        )
      );
    } else {
      setRanking([]);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const isBrasileraoComp = (bolaoRes: { data: Tables<"boloes"> | null }) =>
        (bolaoRes.data as { competition?: string } | null)?.competition === "brasileirao_2026";

      const bolaoRes = await supabase.from("boloes").select("*").eq("id", bolaoId).single();

      const copaBolao = !isBrasileraoComp(bolaoRes);

      const matchesRes = await supabase.from("matches").select("*").order("match_date", { ascending: true });
      setBolao(bolaoRes.data);
      
      const filteredMatches = (matchesRes.data || []).filter((m: any) =>
        !copaBolao
          ? !!m.round_name && !['1ª Rodada','2ª Rodada','3ª Rodada'].includes(m.round_name!)
          : true
      );
      setMatches(filteredMatches);

      setSelectedUserId((prev) => prev ?? user.id);

      await fetchRanking(bolaoId, (bolaoRes.data as any)?.competition || "copa_do_mundo_2026");

      setLoading(false);
    };
    fetchData();
  }, [bolaoId, user]);

  useEffect(() => {
    if (!user) return;
    const fetchMembers = async () => {
      const { data: memberRows } = await supabase
        .from("bolao_members")
        .select("user_id")
        .eq("bolao_id", bolaoId);
      const userIds = (memberRows || []).map((m) => m.user_id);
      if (userIds.length === 0) {
        setBolaoMembers([]);
        return;
      }
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);
      const profileById = Object.fromEntries(
        (profileRows || []).map((p) => [p.user_id, p])
      );
      const members: BolaoMember[] = userIds
        .map((uid) => ({
          user_id: uid,
          username: profileById[uid]?.username || "?",
          avatar_url: profileById[uid]?.avatar_url ?? null,
        }))
        .sort((a, b) => a.username.localeCompare(b.username));
      setBolaoMembers(members);
    };
    fetchMembers();
  }, [bolaoId, user]);

  useEffect(() => {
    if (!selectedUserId || isAdminPalpiteMode) return;

    const loadViewedPredictions = async () => {
      setPredictions(await loadPredictionsForUser(selectedUserId));
      if ((bolao as any)?.competition !== "brasileirao_2026") {
        setRoundPredictions(await fetchRoundPredictions(bolaoId, selectedUserId));
      }
    };

    loadViewedPredictions();
  }, [bolaoId, selectedUserId, isAdminPalpiteMode, bolao]);

  const loadPredictionsForUser = async (userId: string): Promise<Record<string, Prediction>> => {
    const { data } = await supabase
      .from("predictions")
      .select("*")
      .eq("bolao_id", bolaoId)
      .eq("user_id", userId);
    const predsMap: Record<string, Prediction> = {};
    (data || []).forEach((p) => {
      predsMap[p.match_id] = p;
    });
    return predsMap;
  };

  const handleAdminSelectUser = async (userId: string) => {
    const member = bolaoMembers.find((m) => m.user_id === userId);
    setSelectedUserId(userId);
    setAdminTargetUserId(userId);
    setAdminTargetUsername(member?.username ?? null);
    setAdminPredictions(await loadPredictionsForUser(userId));
    if ((bolao as any)?.competition !== "brasileirao_2026") {
      setAdminRoundPredictions(await fetchRoundPredictions(bolaoId, userId));
    }
  };

  const handleAdminClear = () => {
    setAdminTargetUserId(null);
    setAdminTargetUsername(null);
    setAdminPredictions({});
    setAdminRoundPredictions({});
    if (user?.id) setSelectedUserId(user.id);
  };

  const refreshActivePredictions = async () => {
    if (!user) return;
    const userId = isAdminPalpiteMode ? adminTargetUserId! : selectedUserId ?? user.id;
    const predsMap = await loadPredictionsForUser(userId);
    if (isAdminPalpiteMode) {
      setAdminPredictions(predsMap);
      if ((bolao as any)?.competition !== "brasileirao_2026") {
        setAdminRoundPredictions(await fetchRoundPredictions(bolaoId, userId));
      }
    } else {
      setPredictions(predsMap);
      if ((bolao as any)?.competition !== "brasileirao_2026") {
        setRoundPredictions(await fetchRoundPredictions(bolaoId, userId));
      }
    }
  };

  // Realtime subscription to refresh ranking when predictions change
  useEffect(() => {
    if (!bolao) return;
    const competition = (bolao as any)?.competition || "copa_do_mundo_2026";
    const refresh = () => fetchRanking(bolaoId, competition);

    const channel = supabase
      .channel(`predictions-${bolaoId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "predictions", filter: `bolao_id=eq.${bolaoId}` },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "round_predictions", filter: `bolao_id=eq.${bolaoId}` },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bolaoId, bolao]);

  const savePrediction = async (
    matchId: string,
    homeScore: number,
    awayScore: number,
    scorerName: string,
    bonusAnswer?: boolean | null,
    matchDate?: string
  ) => {
    if (!user) return;
    if (readOnlyView) return;
    if (!isAdminPalpiteMode && matchDate && !isMatchPredictionOpen(matchDate)) {
      toast({
        title: "Prazo encerrado",
        description: "O palpite só pode ser feito até o início do jogo.",
        variant: "destructive",
      });
      return;
    }
    setSavingMatch(matchId);

    if (isAdminPalpiteMode && adminTargetUserId) {
      const { error } = await adminUpsertPredictions(bolaoId, adminTargetUserId, [
        {
          match_id: matchId,
          home_score: homeScore,
          away_score: awayScore,
          scorer_name: scorerName || null,
          ...(bonusAnswer !== undefined ? { bonus_answer: bonusAnswer } : {}),
        },
      ]);
      setSavingMatch(null);
      if (error) {
        toast({ title: "Erro ao salvar", description: adminPredictionErrorMessage(error), variant: "destructive" });
        return;
      }
      await refreshActivePredictions();
      if (bolao) await fetchRanking(bolaoId, (bolao as any).competition || "copa_do_mundo_2026");
      toast({ title: `Palpite de @${adminTargetUsername} salvo!` });
      return;
    }

    const predData: any = {
      home_score: homeScore,
      away_score: awayScore,
      scorer_name: scorerName || null,
    };
    if (bonusAnswer !== undefined) predData.bonus_answer = bonusAnswer;

    const existing = predictions[matchId];
    if (existing) {
      await supabase
        .from("predictions")
        .update(predData)
        .eq("id", existing.id);
    } else {
      await supabase.from("predictions").insert({
        bolao_id: bolaoId,
        user_id: user.id,
        match_id: matchId,
        ...predData,
      } as any);
    }

    await refreshActivePredictions();
    setSavingMatch(null);
    toast({ title: "Palpite salvo!" });
  };

  const saveRoundPrediction = async (
    roundKey: string,
    roundMatches: Match[],
    scores: Record<string, { home: number; away: number }>,
    scorerName: string
  ) => {
    if (!user) return;
    if (readOnlyView) return;
    if (!isAdminPalpiteMode) {
      for (const match of roundMatches) {
        const score = scores[match.id];
        if (!score) continue;
        if (!isMatchPredictionOpen(match.match_date)) {
          toast({
            title: "Prazo encerrado",
            description: `O palpite de ${match.home_team} × ${match.away_team} só pode ser feito até o início do jogo.`,
            variant: "destructive",
          });
          return;
        }
      }
      if (scorerName.trim() && !isRoundOpen(roundMatches)) {
        toast({
          title: "Prazo encerrado",
          description: "O artilheiro da rodada fecha no início do primeiro jogo.",
          variant: "destructive",
        });
        return;
      }
    }

    if (
      !isAdminPalpiteMode &&
      scorerName &&
      isScorerAlreadyUsed(scorerName, activeRoundPredictions, roundKey)
    ) {
      toast({
        title: "Jogador já usado",
        description: "Cada jogador só pode ser artilheiro em uma rodada.",
        variant: "destructive",
      });
      return;
    }

    const matchIds = Object.keys(scores);
    const isSingleMatchSave = matchIds.length === 1 && !scorerName.trim();
    const isScorerOnlySave = matchIds.length === 0 && scorerName.trim();

    if (isSingleMatchSave) {
      setSavingMatch(matchIds[0]);
    } else {
      setSavingRound(roundKey);
    }

    const targetUserId = isAdminPalpiteMode ? adminTargetUserId! : user.id;
    const rows = buildRoundPredictionRows(roundMatches, scores);

    if (isAdminPalpiteMode && adminTargetUserId) {
      if (rows.length === 0 && !scorerName.trim()) {
        setSavingMatch(null);
        setSavingRound(null);
        toast({
          title: "Nada para salvar",
          description: "Preencha ao menos um jogo ou o artilheiro da rodada.",
          variant: "destructive",
        });
        return;
      }

      if (rows.length > 0) {
        const { error } = await adminUpsertPredictions(bolaoId, adminTargetUserId, rows);
        if (error) {
          setSavingMatch(null);
          setSavingRound(null);
          toast({ title: "Erro ao salvar", description: adminPredictionErrorMessage(error), variant: "destructive" });
          return;
        }
      }
      if (scorerName.trim()) {
        const { error: rpError } = await upsertRoundPrediction(
          id,
          adminTargetUserId,
          roundKey,
          scorerName
        );
        if (rpError) {
          setSavingMatch(null);
          setSavingRound(null);
          toast({ title: "Erro ao salvar artilheiro", description: rpError.message, variant: "destructive" });
          return;
        }
      }
      setSavingMatch(null);
      setSavingRound(null);
      await refreshActivePredictions();
      if (bolao) await fetchRanking(bolaoId, (bolao as any).competition || "copa_do_mundo_2026");
      const adminToast =
        rows.length === 1 && !scorerName.trim()
          ? `Palpite de @${adminTargetUsername} salvo!`
          : isScorerOnlySave
          ? `Artilheiro de @${adminTargetUsername} salvo!`
          : `Palpites de @${adminTargetUsername} salvos!`;
      toast({ title: adminToast });
      return;
    }

    const scoreRows = buildRoundPredictionRows(roundMatches, scores).filter((row) => {
      if (isAdminPalpiteMode) return true;
      const match = roundMatches.find((m) => m.id === row.match_id);
      return match && isMatchPredictionOpen(match.match_date);
    });

    if (scoreRows.length === 0 && !scorerName.trim()) {
      setSavingMatch(null);
      setSavingRound(null);
      toast({
        title: "Nada para salvar",
        description: "Não há jogos em aberto para palpitar.",
        variant: "destructive",
      });
      return;
    }

    if (scoreRows.length > 0) {
      const predRows = scoreRows.map((row) => {
        const existing = predictions[row.match_id];
        return {
          ...(existing ? { id: existing.id } : {}),
          bolao_id: bolaoId,
          user_id: targetUserId,
          match_id: row.match_id,
          home_score: row.home_score,
          away_score: row.away_score,
          scorer_name: null,
        };
      });

      const { error } = await supabase.from("predictions").upsert(predRows, {
        onConflict: "bolao_id,user_id,match_id",
      });

      if (error) {
        setSavingMatch(null);
        setSavingRound(null);
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        return;
      }
    }

    if (scorerName.trim()) {
      const { error: rpError } = await upsertRoundPrediction(bolaoId, targetUserId, roundKey, scorerName);
      if (rpError) {
        setSavingMatch(null);
        setSavingRound(null);
        toast({ title: "Erro ao salvar artilheiro", description: rpError.message, variant: "destructive" });
        return;
      }
    }

    setSavingMatch(null);
    setSavingRound(null);
    await refreshActivePredictions();
    const toastTitle =
      scoreRows.length === 1 && !scorerName.trim()
        ? "Palpite salvo!"
        : isScorerOnlySave
        ? "Artilheiro salvo!"
        : "Palpites salvos!";
    toast({ title: toastTitle });
  };

  const shareRanking = () => {
    if (!bolao || ranking.length === 0) return;
    const lines = [`🏆 Ranking ${bolao.name}\n`];
    ranking.forEach((r) => {
      const tie = r.tied ? " (empate)" : "";
      lines.push(`${r.rank}. ${r.username} - ${r.total}pts${tie}`);
    });
    lines.push(`\nParticipe também: ${APP_PUBLIC_URL}`);
    const text = lines.join("\n");
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareApp = () => {
    const isLovableHost = /lovable(project)?\.app$/.test(window.location.hostname);
    const url = isLovableHost ? APP_PUBLIC_URL : window.location.origin;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: "Compartilhe o app com seus amigos" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ThemeCornerButton />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!bolao) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ThemeCornerButton />
        <p>Bolão não encontrado</p>
      </div>
    );
  }

  const isMatchLocked = (match: Match) =>
    !isAdminPalpiteMode && !isMatchPredictionOpen(match.match_date);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PageHeader
        title={bolao.name}
        onBack={() => navigate("/")}
        actions={
          <>
            <ScoringRulesModal />
            <Button
              variant="ghost"
              size="icon"
              onClick={shareApp}
              className="text-primary-foreground hover:bg-primary-foreground/10"
              aria-label="Compartilhar app"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </>
        }
      />

      <main className="mx-auto w-full max-w-lg flex-1 p-4 pb-safe">
        <Tabs defaultValue={searchParams.get("tab") || "palpites"}>
          <TabsList className="tabs-list-scroll">
            <TabsTrigger value="palpites" className="flex-1 sm:flex-initial">Palpites</TabsTrigger>
            <TabsTrigger value="ranking" className="flex-1 sm:flex-initial">Ranking</TabsTrigger>
            {(bolao as any).competition === "copa_do_mundo_2026" && (
              <TabsTrigger value="feed" className="flex-1 sm:flex-initial">Feed</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="palpites" className="relative space-y-3 pt-4">
            <MemberPredictionsSelector
              members={bolaoMembers}
              selectedUserId={isAdminPalpiteMode ? adminTargetUserId : selectedUserId}
              currentUserId={user!.id}
              onSelect={setSelectedUserId}
              disabled={isAdminPalpiteMode}
            />
            {isAdmin && <AdminSetupBanner />}
            {isAdmin && (
              <AdminPalpiteControl
                members={bolaoMembers}
                targetUserId={adminTargetUserId}
                targetUsername={adminTargetUsername}
                onSelectUser={handleAdminSelectUser}
                onClear={handleAdminClear}
              />
            )}
            {(bolao as any).competition !== "brasileirao_2026" && (
              <SeasonPredictions
                bolaoId={bolaoId}
                userId={displayUserId}
                readOnly={readOnlyView}
              />
            )}
            {matches.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Nenhum jogo cadastrado ainda
              </p>
            ) : (
              <RoundsAccordion
                matches={matches}
                predictions={activePredictions}
                roundPredictions={activeRoundPredictions}
                savingMatch={savingMatch}
                savingRound={savingRound}
                onSave={savePrediction}
                onSaveRound={saveRoundPrediction}
                isMatchLocked={isMatchLocked}
                forceEditable={isAdminPalpiteMode}
                readOnly={readOnlyView}
                isBrasileirao={(bolao as any).competition === "brasileirao_2026"}
              />
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
                  {ranking.map((r) => (
                    <div
                      key={`${r.rank}-${r.username}`}
                      className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3 sm:gap-3 sm:p-4"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            r.rank === 1
                              ? "bg-accent text-accent-foreground"
                              : r.rank === 2
                              ? "bg-muted text-muted-foreground"
                              : r.rank === 3
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {r.rank}
                        </span>
                        <UserAvatar username={r.username} avatarUrl={r.avatarUrl} size="md" className="shrink-0" />
                        <span className="min-w-0 truncate font-medium">
                          {r.username}
                          {r.tied && (
                            <span className="ml-1 text-xs text-muted-foreground">(empate)</span>
                          )}
                        </span>
                      </div>
                      <span className="shrink-0 text-base font-bold text-accent sm:text-lg">{r.total} pts</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full" onClick={shareRanking}>
                  <Share2 className="mr-2 h-4 w-4" /> Compartilhar Ranking no WhatsApp
                </Button>
              </div>
            )}
          </TabsContent>

          {(bolao as any).competition === "copa_do_mundo_2026" && (
            <TabsContent value="feed" className="pt-4">
              <BolaoFeed bolaoId={bolaoId} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

const RoundsAccordion = ({
  matches,
  predictions,
  roundPredictions,
  savingMatch,
  savingRound,
  onSave,
  onSaveRound,
  isMatchLocked,
  forceEditable = false,
  readOnly = false,
  isBrasileirao,
}: {
  matches: Match[];
  predictions: Record<string, Prediction>;
  roundPredictions: Record<string, RoundPrediction>;
  savingMatch: string | null;
  savingRound: string | null;
  onSave: (matchId: string, home: number, away: number, scorer: string, bonusAnswer?: boolean | null, matchDate?: string) => void;
  onSaveRound: (
    roundKey: string,
    roundMatches: Match[],
    scores: Record<string, { home: number; away: number }>,
    scorerName: string
  ) => Promise<void>;
  isMatchLocked: (m: Match) => boolean;
  forceEditable?: boolean;
  readOnly?: boolean;
  isBrasileirao: boolean;
}) => {
  const byRound = useMemo(() => groupByRound(matches), [matches]);
  const rounds = useMemo(() => orderedRounds(byRound), [byRound]);
  const closestRound = useMemo(() => getClosestRound(matches), [matches]);

  const byCopaRound = useMemo(() => groupByRoundKey(matches), [matches]);
  const copaRoundKeys = useMemo(() => orderedRoundKeys(byCopaRound), [byCopaRound]);
  const closestCopaRound = useMemo(() => getClosestRoundKey(matches), [matches]);
  const [openRounds, setOpenRounds] = useState<string[]>([]);
  const [openCopaRounds, setOpenCopaRounds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    if (isBrasileirao) {
      if (rounds.length === 0) return;
      setOpenRounds(closestRound ? [closestRound] : []);
    } else {
      if (copaRoundKeys.length === 0) return;
      setOpenCopaRounds(closestCopaRound ? [closestCopaRound] : []);
    }
    setInitialized(true);
  }, [isBrasileirao, rounds, copaRoundKeys, closestRound, closestCopaRound, initialized]);

  const allExpanded = isBrasileirao
    ? rounds.length > 0 && openRounds.length === rounds.length
    : copaRoundKeys.length > 0 && openCopaRounds.length === copaRoundKeys.length;

  const toggleAll = () => {
    if (isBrasileirao) {
      setOpenRounds(allExpanded ? [] : [...rounds]);
    } else {
      setOpenCopaRounds(allExpanded ? [] : [...copaRoundKeys]);
    }
  };

  const renderCard = (match: Match) => (
    <MatchPredictionCard
      key={match.id}
      match={match}
      prediction={predictions[match.id]}
      locked={isMatchLocked(match)}
      forceEditable={forceEditable}
      readOnly={readOnly}
      saving={savingMatch === match.id}
      onSave={onSave}
      isBrasileirao={isBrasileirao}
    />
  );

  return (
    <>
      <div className="mb-3 flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={toggleAll}>
          {allExpanded ? "Recolher tudo" : "Expandir tudo"}
        </Button>
      </div>
      {isBrasileirao ? (
        <Accordion
          type="multiple"
          value={openRounds}
          onValueChange={setOpenRounds}
          className="space-y-2"
        >
          {rounds.map((round) => {
            const roundMatches = byRound[round];
            return (
              <AccordionItem
                key={round}
                value={round}
                className="rounded-lg border bg-card px-3"
              >
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold">
                    {round}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {roundMatches.length} jogos
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">{roundMatches.map(renderCard)}</div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <Accordion
          type="multiple"
          value={openCopaRounds}
          onValueChange={setOpenCopaRounds}
          className="space-y-2"
        >
          {copaRoundKeys.map((roundKey) => {
            const roundMatches = byCopaRound[roundKey];
            return (
              <AccordionItem
                key={roundKey}
                value={roundKey}
                className="rounded-lg border bg-card px-3"
              >
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold">
                    {getRoundLabelFromKey(roundKey)}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {roundMatches.length} jogos
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <RoundPredictionPanel
                    roundKey={roundKey}
                    matches={roundMatches}
                    predictions={predictions}
                    roundPredictions={roundPredictions}
                    usedScorerNames={getUsedScorerNames(roundPredictions, roundKey)}
                    savingMatchId={savingMatch}
                    savingScorer={savingRound === roundKey}
                    forceEditable={forceEditable}
                    readOnly={readOnly}
                    onSaveRound={onSaveRound}
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </>
  );
};

// Sub-component for match prediction
const MatchPredictionCard = ({
  match,
  prediction,
  locked,
  forceEditable = false,
  readOnly = false,
  saving,
  onSave,
  isBrasileirao = false,
}: {
  match: Tables<"matches">;
  prediction?: Tables<"predictions">;
  locked: boolean;
  forceEditable?: boolean;
  readOnly?: boolean;
  saving: boolean;
  onSave: (matchId: string, home: number, away: number, scorer: string, bonusAnswer?: boolean | null, matchDate?: string) => void;
  isBrasileirao?: boolean;
}) => {
  const isEditable = forceEditable || (!readOnly && !locked);
  const [homeScore, setHomeScore] = useState(prediction?.home_score?.toString() || "");
  const [awayScore, setAwayScore] = useState(prediction?.away_score?.toString() || "");
  const [scorer, setScorer] = useState(prediction?.scorer_name || "");
  const [bonusAnswer, setBonusAnswer] = useState<string>(
    (prediction as any)?.bonus_answer === true ? "sim" : (prediction as any)?.bonus_answer === false ? "nao" : ""
  );
  const awayScoreRef = useRef<HTMLInputElement>(null);
  const scorerRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const squadPlayers = useMemo(() => {
    const s = squads as Record<string, string[]>;
    return [...(s[match.home_team] ?? []), ...(s[match.away_team] ?? [])]
      .sort((a, b) => a.localeCompare(b));
  }, [match.home_team, match.away_team]);

  const bonusQuestion = (match as any).bonus_question as string | null;

  const handleSave = () => {
    const h = parseInt(homeScore);
    const a = parseInt(awayScore);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    const ba = bonusAnswer === "sim" ? true : bonusAnswer === "nao" ? false : null;
    onSave(match.id, h, a, scorer, ba, match.match_date);
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
  const today = isMatchToday(match.match_date);

  return (
    <Card
      className={cn(
        !isEditable ? "opacity-70" : "",
        today && matchTodayHighlightClass
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {isBrasileirao
              ? ((match as any).round_name || "")
              : `${stageLabels[match.stage] || match.stage}${match.group_name ? ` • ${match.group_name}` : ""}`}
          </span>
        </div>
        <CardTitle className="text-base">
          <MatchTeamsDisplay
            homeTeam={match.home_team}
            awayTeam={match.away_team}
            size={64}
            style="shiny"
            dateTime={formatMatchDateTime(match.match_date)}
            dateTimeClassName={
              today ? "font-medium text-green-700 dark:text-green-400" : undefined
            }
          />
        </CardTitle>
        {match.is_finished && (
          <p className="text-sm font-bold text-accent">
            Resultado: {match.home_score} × {match.away_score}
          </p>
        )}
        {readOnly && !forceEditable ? (
          <p className="text-center text-xs font-medium text-muted-foreground">
            Palpite de outro participante
          </p>
        ) : forceEditable ? (
          <p className="text-center text-xs font-medium text-amber-700 dark:text-amber-300">
            Modo admin — prazo ignorado
          </p>
        ) : !locked ? (
          <p className="text-center text-xs text-muted-foreground">
            Prazo: até {formatDeadline(matchDate)} (início do jogo)
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        {!isEditable ? (
          prediction ? (
            <div className="space-y-1 text-sm">
              <p>
                {readOnly ? "Palpite" : "Seu palpite"}:{" "}
                <span className="font-bold">{prediction.home_score} × {prediction.away_score}</span>
              </p>
              {!isBrasileirao && prediction.scorer_name && (
                <p>Goleador: <span className="font-medium">{prediction.scorer_name}</span></p>
              )}
              {isBrasileirao && bonusQuestion && (prediction as any)?.bonus_answer !== null && (
                <p>{bonusQuestion} <span className="font-medium">{(prediction as any)?.bonus_answer ? "Sim" : "Não"}</span></p>
              )}
              {prediction.points !== null && (
                <p className="font-bold text-accent">+{(prediction.points || 0) + (prediction.scorer_points || 0) + ((prediction as any)?.bonus_points || 0)} pts</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {readOnly ? "Sem palpite" : "Sem palpite (jogo travado)"}
            </p>
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
                className="score-input"
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
                  if (val.length >= 1 && /^\d+$/.test(val) && !isBrasileirao) {
                    scorerRef.current?.focus();
                  }
                }}
                className="score-input"
              />
            </div>
            {isBrasileirao && bonusQuestion ? (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{bonusQuestion}</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={bonusAnswer === "sim" ? "default" : "outline"}
                    onClick={() => setBonusAnswer(bonusAnswer === "sim" ? "" : "sim")}
                  >
                    Sim
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={bonusAnswer === "nao" ? "default" : "outline"}
                    onClick={() => setBonusAnswer(bonusAnswer === "nao" ? "" : "nao")}
                  >
                    Não
                  </Button>
                </div>
              </div>
            ) : !isBrasileirao ? (
              <div className="relative">
                <Input
                  ref={scorerRef}
                  placeholder="Jogador que marca (opcional)"
                  value={scorer}
                  onFocus={() => setSuggestions(squadPlayers)}
                  onChange={(e) => {
                    setScorer(e.target.value);
                    const q = e.target.value.toLowerCase();
                    setSuggestions(q.length === 0
                      ? squadPlayers
                      : squadPlayers.filter(p => p.toLowerCase().includes(q)).slice(0, 8));
                  }}
                  onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                  onKeyDown={(e) => { if (e.key === "Escape") setSuggestions([]); }}
                />
                {suggestions.length > 0 && (
                  <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                    {suggestions.map((p) => (
                      <li
                        key={p}
                        className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onMouseDown={(e) => { e.preventDefault(); setScorer(p); setSuggestions([]); }}
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : forceEditable ? (
                "Salvar palpite do participante"
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BolaoDetail;
