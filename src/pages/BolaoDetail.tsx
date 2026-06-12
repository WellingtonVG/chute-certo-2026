import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminPalpiteControl, { type BolaoMember } from "@/components/AdminPalpiteControl";
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
import { ArrowLeft, Loader2, Trophy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { getSeasonPointsTotal } from "@/lib/season-predictions";
import { MatchTeamsDisplay } from "@/components/CountryFlag";
import { formatDeadline, isMatchPredictionOpen } from "@/lib/prediction-deadlines";
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

type Match = Tables<"matches">;
type Prediction = Tables<"predictions">;

const BolaoDetail = () => {
  const { id } = useParams<{ id: string }>();
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

  const isAdminPalpiteMode = !!adminTargetUserId;
  const activePredictions = isAdminPalpiteMode ? adminPredictions : predictions;
  const activeRoundPredictions = isAdminPalpiteMode ? adminRoundPredictions : roundPredictions;

  const fetchRanking = async (bolaoId: string, competition: string) => {
    const [{ data: allPreds }, { data: roundPreds }] = await Promise.all([
      supabase
        .from("predictions")
        .select("user_id, points, bonus_points")
        .eq("bolao_id", bolaoId),
      competition !== "brasileirao_2026"
        ? supabase
            .from("round_predictions")
            .select("user_id, scorer_points")
            .eq("bolao_id", bolaoId)
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
        .eq("bolao_id", bolaoId);

      (seasonPreds || []).forEach((sp) => {
        totals[sp.user_id] = (totals[sp.user_id] || 0) + getSeasonPointsTotal(sp);
      });
    }

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

      setRanking(
        buildRanking(
          userIds.map((uid) => ({ username: profileMap[uid] || "?", total: totals[uid] }))
        )
      );
    } else {
      setRanking([]);
    }
  };

  useEffect(() => {
    if (!id || !user) return;
    const fetchData = async () => {
      const isBrasileraoComp = (bolaoRes: { data: Tables<"boloes"> | null }) =>
        (bolaoRes.data as { competition?: string } | null)?.competition === "brasileirao_2026";

      const bolaoRes = await supabase.from("boloes").select("*").eq("id", id).single();

      const copaBolao = !isBrasileraoComp(bolaoRes);

      const [matchesRes, predsRes, roundPredsMap] = await Promise.all([
        supabase.from("matches").select("*").order("match_date", { ascending: true }),
        supabase.from("predictions").select("*").eq("bolao_id", id).eq("user_id", user.id),
        copaBolao ? fetchRoundPredictions(id, user.id) : Promise.resolve({} as Record<string, RoundPrediction>),
      ]);
      setBolao(bolaoRes.data);
      
      const filteredMatches = (matchesRes.data || []).filter((m: any) =>
        !copaBolao
          ? !!m.round_name && !['1ª Rodada','2ª Rodada','3ª Rodada'].includes(m.round_name!)
          : true
      );
      setMatches(filteredMatches);

      const predsMap: Record<string, Prediction> = {};
      (predsRes.data || []).forEach((p) => {
        predsMap[p.match_id] = p;
      });
      setPredictions(predsMap);

      if (copaBolao) {
        setRoundPredictions(roundPredsMap);
      }

      await fetchRanking(id, (bolaoRes.data as any)?.competition || "copa_do_mundo_2026");

      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  useEffect(() => {
    if (!id || !isAdmin) return;
    const fetchMembers = async () => {
      const { data: memberRows } = await supabase
        .from("bolao_members")
        .select("user_id")
        .eq("bolao_id", id);
      const userIds = (memberRows || []).map((m) => m.user_id);
      if (userIds.length === 0) {
        setBolaoMembers([]);
        return;
      }
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);
      const usernameById = Object.fromEntries(
        (profileRows || []).map((p) => [p.user_id, p.username])
      );
      const members: BolaoMember[] = userIds
        .map((uid) => ({ user_id: uid, username: usernameById[uid] || "?" }))
        .sort((a, b) => a.username.localeCompare(b.username));
      setBolaoMembers(members);
    };
    fetchMembers();
  }, [id, isAdmin]);

  const loadPredictionsForUser = async (userId: string): Promise<Record<string, Prediction>> => {
    if (!id) return {};
    const { data } = await supabase
      .from("predictions")
      .select("*")
      .eq("bolao_id", id)
      .eq("user_id", userId);
    const predsMap: Record<string, Prediction> = {};
    (data || []).forEach((p) => {
      predsMap[p.match_id] = p;
    });
    return predsMap;
  };

  const handleAdminSelectUser = async (userId: string) => {
    const member = bolaoMembers.find((m) => m.user_id === userId);
    setAdminTargetUserId(userId);
    setAdminTargetUsername(member?.username ?? null);
    setAdminPredictions(await loadPredictionsForUser(userId));
    if (id && (bolao as any)?.competition !== "brasileirao_2026") {
      setAdminRoundPredictions(await fetchRoundPredictions(id, userId));
    }
  };

  const handleAdminClear = () => {
    setAdminTargetUserId(null);
    setAdminTargetUsername(null);
    setAdminPredictions({});
    setAdminRoundPredictions({});
  };

  const refreshActivePredictions = async () => {
    if (!id || !user) return;
    const userId = isAdminPalpiteMode ? adminTargetUserId! : user.id;
    const predsMap = await loadPredictionsForUser(userId);
    if (isAdminPalpiteMode) {
      setAdminPredictions(predsMap);
      if ((bolao as any)?.competition !== "brasileirao_2026") {
        setAdminRoundPredictions(await fetchRoundPredictions(id, userId));
      }
    } else {
      setPredictions(predsMap);
      if ((bolao as any)?.competition !== "brasileirao_2026") {
        setRoundPredictions(await fetchRoundPredictions(id, userId));
      }
    }
  };

  // Realtime subscription to refresh ranking when predictions change
  useEffect(() => {
    if (!id || !bolao) return;
    const competition = (bolao as any)?.competition || "copa_do_mundo_2026";
    const refresh = () => fetchRanking(id, competition);

    const channel = supabase
      .channel(`predictions-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "predictions", filter: `bolao_id=eq.${id}` },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "round_predictions", filter: `bolao_id=eq.${id}` },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, bolao]);

  const savePrediction = async (
    matchId: string,
    homeScore: number,
    awayScore: number,
    scorerName: string,
    bonusAnswer?: boolean | null,
    matchDate?: string
  ) => {
    if (!user || !id) return;
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
      const { error } = await adminUpsertPredictions(id, adminTargetUserId, [
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
      if (bolao) await fetchRanking(id, (bolao as any).competition || "copa_do_mundo_2026");
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
        bolao_id: id,
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
    if (!user || !id) return;
    if (!isAdminPalpiteMode && !isRoundOpen(roundMatches)) {
      toast({
        title: "Prazo encerrado",
        description: "A rodada fecha no início do primeiro jogo.",
        variant: "destructive",
      });
      return;
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

    const savingKey = roundKey;
    setSavingRound(savingKey);

    const targetUserId = isAdminPalpiteMode ? adminTargetUserId! : user.id;
    const rows = buildRoundPredictionRows(roundMatches, scores);

    if (isAdminPalpiteMode && adminTargetUserId) {
      if (rows.length === 0 && !scorerName.trim()) {
        setSavingRound(null);
        toast({
          title: "Nada para salvar",
          description: "Preencha ao menos um jogo ou o artilheiro da rodada.",
          variant: "destructive",
        });
        return;
      }

      if (rows.length > 0) {
        const { error } = await adminUpsertPredictions(id, adminTargetUserId, rows);
        if (error) {
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
          setSavingRound(null);
          toast({ title: "Erro ao salvar artilheiro", description: rpError.message, variant: "destructive" });
          return;
        }
      }
      setSavingRound(null);
      await refreshActivePredictions();
      if (bolao) await fetchRanking(id, (bolao as any).competition || "copa_do_mundo_2026");
      toast({ title: `Palpites de @${adminTargetUsername} salvos!` });
      return;
    }

    const predRows = roundMatches.map((match) => {
      const existing = predictions[match.id];
      const { home, away } = scores[match.id];
      return {
        ...(existing ? { id: existing.id } : {}),
        bolao_id: id,
        user_id: targetUserId,
        match_id: match.id,
        home_score: home,
        away_score: away,
        scorer_name: null,
      };
    });

    const { error } = await supabase.from("predictions").upsert(predRows, {
      onConflict: "bolao_id,user_id,match_id",
    });

    if (error) {
      setSavingRound(null);
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }

    if (scorerName.trim()) {
      const { error: rpError } = await upsertRoundPrediction(id, targetUserId, roundKey, scorerName);
      if (rpError) {
        setSavingRound(null);
        toast({ title: "Erro ao salvar artilheiro", description: rpError.message, variant: "destructive" });
        return;
      }
    }

    setSavingRound(null);
    await refreshActivePredictions();
    toast({ title: "Palpites da rodada salvos!" });
  };

  const shareRanking = () => {
    if (!bolao || ranking.length === 0) return;
    const lines = [`🏆 Ranking ${bolao.name}\n`];
    ranking.forEach((r) => {
      const tie = r.tied ? " (empate)" : "";
      lines.push(`${r.rank}. ${r.username} - ${r.total}pts${tie}`);
    });
    lines.push(`\nParticipe também: https://chute-certo-2026.lovable.app`);
    const text = lines.join("\n");
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  const shareInvite = () => {
    if (!bolao) return;
    const isLovableHost = /lovable(project)?\.app$/.test(window.location.hostname);
    const origin = isLovableHost ? "https://chute-certo-2026.lovable.app" : window.location.origin;
    const url = `${origin}/convite/${bolao.invite_code}`;
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

  const isMatchLocked = (match: Match) =>
    !isAdminPalpiteMode && !isMatchPredictionOpen(match.match_date);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-primary px-4 py-4 text-primary-foreground">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
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
        <Tabs defaultValue={searchParams.get("tab") || "palpites"}>
          <TabsList className="w-full">
            <TabsTrigger value="palpites" className="flex-1">Palpites</TabsTrigger>
            <TabsTrigger value="ranking" className="flex-1">Ranking</TabsTrigger>
            {(bolao as any).competition === "copa_do_mundo_2026" && (
              <TabsTrigger value="feed" className="flex-1">Feed</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="palpites" className="relative space-y-3 pt-4">
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
            {(bolao as any).competition !== "brasileirao_2026" && !isAdminPalpiteMode && (
              <SeasonPredictions bolaoId={id!} userId={user!.id} />
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
                      className="flex items-center justify-between rounded-lg border bg-card p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
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
                        <span className="font-medium">
                          {r.username}
                          {r.tied && (
                            <span className="ml-1 text-xs text-muted-foreground">(empate)</span>
                          )}
                        </span>
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

          {(bolao as any).competition === "copa_do_mundo_2026" && (
            <TabsContent value="feed" className="pt-4">
              <BolaoFeed bolaoId={id!} />
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
                    saving={savingRound === roundKey}
                    forceEditable={forceEditable}
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
  saving,
  onSave,
  isBrasileirao = false,
}: {
  match: Tables<"matches">;
  prediction?: Tables<"predictions">;
  locked: boolean;
  forceEditable?: boolean;
  saving: boolean;
  onSave: (matchId: string, home: number, away: number, scorer: string, bonusAnswer?: boolean | null, matchDate?: string) => void;
  isBrasileirao?: boolean;
}) => {
  const isEditable = forceEditable || !locked;
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

  return (
    <Card className={!isEditable ? "opacity-70" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {isBrasileirao
              ? ((match as any).round_name || "")
              : `${stageLabels[match.stage] || match.stage}${match.group_name ? ` • ${match.group_name}` : ""}`}
          </span>
          <span className="text-xs text-muted-foreground">
            {matchDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            {" "}
            {matchDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}
          </span>
        </div>
        <CardTitle className="text-base">
          <MatchTeamsDisplay homeTeam={match.home_team} awayTeam={match.away_team} size={64} style="shiny" />
        </CardTitle>
        {match.is_finished && (
          <p className="text-sm font-bold text-accent">
            Resultado: {match.home_score} × {match.away_score}
          </p>
        )}
        {forceEditable ? (
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
                Seu palpite: <span className="font-bold">{prediction.home_score} × {prediction.away_score}</span>
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
                  if (val.length >= 1 && /^\d+$/.test(val) && !isBrasileirao) {
                    scorerRef.current?.focus();
                  }
                }}
                className="w-16 text-center"
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
