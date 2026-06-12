import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Save, RefreshCw, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SEASON_PREDICTION_POINTS } from "@/lib/season-predictions";
import { MatchTeamsDisplay } from "@/components/CountryFlag";
import { TeamSelect } from "@/components/TeamSelect";
import { DEFAULT_BOLAO_ID, DEFAULT_BOLAO_PATH } from "@/lib/bolao-config";
import RoundScorersEditor from "@/components/admin/RoundScorersEditor";
import UserAvatarEditor from "@/components/admin/UserAvatarEditor";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { groupByRoundKey, orderedRoundKeys } from "@/lib/match-stages";
import { getRoundLabelFromKey } from "@/lib/copa-rounds";
import { PageHeader } from "@/components/PageHeader";

type Match = Tables<"matches">;
type Bolao = Tables<"boloes"> & { invite_created_at?: string };

const stageOptions = Constants.public.Enums.match_stage;
const stageLabels: Record<string, string> = {
  group: "Fase de Grupos",
  round_of_32: "32 avos",
  round_of_16: "Oitavas",
  quarter_final: "Quartas",
  semi_final: "Semifinal",
  third_place: "3º Lugar",
  final: "Final",
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [boloes, setBoloes] = useState<Bolao[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<{
    bolao_id: string;
    bolao_name: string;
    user_id: string;
    username: string;
    avatar_url: string | null;
    joined_at: string;
    member_id: string;
  }[]>([]);
  const [allProfiles, setAllProfiles] = useState<
    { user_id: string; username: string; avatar_url: string | null }[]
  >([]);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  const bonusQuestionOptions = [
    "Nenhuma",
    "Vai ter gol no primeiro tempo?",
    "Vai ter gol no segundo tempo?",
    "Vai ter cartão vermelho?",
    "Vai ter pênalti?",
    "Vai ter gol nos acréscimos?",
    "O time mandante vai marcar?",
    "Vai ter mais de 2 gols no jogo?",
  ];

  // New match form
  const [matchForm, setMatchForm] = useState({
    home_team: "",
    away_team: "",
    match_date: "",
    stadium: "",
    city: "",
    stage: "group" as string,
    group_name: "",
    round_name: "",
  });
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [syncing, setSyncing] = useState(false);
  // Round bonus
  const [bonusRound, setBonusRound] = useState("");
  const [bonusRoundQuestion, setBonusRoundQuestion] = useState("Nenhuma");
  const [savingBonusRound, setSavingBonusRound] = useState(false);

  const availableRounds = [...new Set(matches.filter(m => m.round_name).map(m => m.round_name!))].sort();

  const saveRoundBonus = async () => {
    if (!bonusRound) return;
    setSavingBonusRound(true);
    const questionValue = bonusRoundQuestion !== "Nenhuma" ? bonusRoundQuestion : null;
    const { error } = await supabase
      .from("matches")
      .update({ bonus_question: questionValue } as any)
      .eq("round_name", bonusRound);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setMatches(prev => prev.map(m => m.round_name === bonusRound ? { ...m, bonus_question: questionValue } : m));
      toast({ title: "Pergunta bônus salva para " + bonusRound + "!" });
    }
    setSavingBonusRound(false);
  };


  const syncFixtures = async () => {
    setSyncing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Não autenticado");

      const res = await supabase.functions.invoke("sync-fixtures");
      if (res.error) throw res.error;
      const body = res.data;
      toast({ title: "Sincronizado!", description: body.message || `${body.synced} jogos` });

      const { data: freshMatches } = await supabase.from("matches").select("*").order("match_date", { ascending: true });
      if (freshMatches) setMatches(freshMatches);
    } catch (err: any) {
      toast({ title: "Erro ao sincronizar", description: err.message || String(err), variant: "destructive" });
    }
    setSyncing(false);
  };

  const [syncingResults, setSyncingResults] = useState(false);
  const syncResults = async () => {
    setSyncingResults(true);
    try {
      const res = await supabase.functions.invoke("sync-results", { method: "POST" });
      if (res.error) throw res.error;
      toast({ title: "sync-results", description: JSON.stringify(res.data) });
      alert("sync-results:\n" + JSON.stringify(res.data, null, 2));
    } catch (err: any) {
      toast({ title: "Erro sync-results", description: err.message || String(err), variant: "destructive" });
    }
    setSyncingResults(false);
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    const fetchData = async () => {
      const [boloesRes, matchesRes, membersRes, profilesRes] = await Promise.all([
        supabase.from("boloes").select("*").eq("id", DEFAULT_BOLAO_ID).maybeSingle(),
        supabase.from("matches").select("*").order("match_date", { ascending: true }),
        supabase.from("bolao_members").select("*").eq("bolao_id", DEFAULT_BOLAO_ID),
        supabase.from("profiles").select("user_id, username, avatar_url").order("username"),
      ]);
      const boloesData = boloesRes.data ? [boloesRes.data as Bolao] : [];
      setBoloes(boloesData);
      setMatches(matchesRes.data || []);

      // Load profiles for members
      const memberData = membersRes.data || [];
      const profilesData = profilesRes.data || [];
      setAllProfiles(profilesData);

      let profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
      profilesData.forEach((p) => {
        profileMap[p.user_id] = { username: p.username, avatar_url: p.avatar_url };
      });
      const bolaoNameMap: Record<string, string> = {};
      boloesData.forEach((b) => { bolaoNameMap[b.id] = b.name; });

      setMembers(memberData.map((m) => ({
        bolao_id: m.bolao_id,
        bolao_name: bolaoNameMap[m.bolao_id] || "?",
        user_id: m.user_id,
        username: profileMap[m.user_id]?.username || "?",
        avatar_url: profileMap[m.user_id]?.avatar_url ?? null,
        joined_at: m.joined_at,
        member_id: m.id,
      })));
      setLoading(false);
    };
    fetchData();
  }, [isAdmin, navigate]);

  const createMatch = async () => {
    if (!matchForm.home_team || !matchForm.away_team || !matchForm.match_date) return;
    setCreatingMatch(true);
    const { data, error } = await supabase
      .from("matches")
      .insert({
        home_team: matchForm.home_team,
        away_team: matchForm.away_team,
        match_date: new Date(matchForm.match_date).toISOString(),
        stadium: matchForm.stadium || null,
        city: matchForm.city || null,
        stage: matchForm.stage as any,
        group_name: matchForm.group_name || null,
        round_name: matchForm.round_name || null,
      } as any)
      .select()
      .single();

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else if (data) {
      setMatches((prev) => [...prev, data].sort((a, b) => a.match_date.localeCompare(b.match_date)));
      setMatchForm({ home_team: "", away_team: "", match_date: "", stadium: "", city: "", stage: "group", group_name: "", round_name: "" });
      toast({ title: "Jogo criado!" });
    }
    setCreatingMatch(false);
  };

  const updateMatchResult = async (matchId: string, homeScore: number, awayScore: number, bonusResult?: boolean | null): Promise<void> => {
    const updateData: any = { home_score: homeScore, away_score: awayScore, is_finished: true, is_manual_override: true };
    if (bonusResult !== undefined) updateData.bonus_result = bonusResult;
    const { error } = await supabase
      .from("matches")
      .update(updateData)
      .eq("id", matchId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    // Recalculate match points for all predictions
    const { error: pointsError } = await supabase.rpc("calculate_match_points", {
      match_id_input: matchId,
    } as any);
    if (pointsError) {
      toast({ title: "Erro ao calcular pontos", description: pointsError.message, variant: "destructive" });
    }

    // Recalculate bonus points if bonus result is set
    if (bonusResult !== undefined && bonusResult !== null) {
      const { error: rpcError } = await supabase.rpc("calculate_bonus_points", {
        match_id_input: matchId,
        bonus_result_input: bonusResult,
      } as any);
      if (rpcError) {
        toast({ title: "Erro ao calcular bônus", description: rpcError.message, variant: "destructive" });
      }
    }

    // Generate feed events (fire-and-forget, errors don't block)
    try {
      await supabase.functions.invoke("generate-feed-events", {
        body: { match_id: matchId },
      });
    } catch (e) {
      console.warn("generate-feed-events failed", e);
    }

    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, home_score: homeScore, away_score: awayScore, is_finished: true, is_manual_override: true, ...(bonusResult !== undefined ? { bonus_result: bonusResult } : {}) }
          : m
      )
    );
    toast({ title: "Resultado salvo e pontos recalculados!" });
  };

  const removeMember = async (memberId: string) => {
    setRemovingMember(memberId);
    const { error } = await supabase.from("bolao_members").delete().eq("id", memberId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setMembers((prev) => prev.filter((m) => m.member_id !== memberId));
      toast({ title: "Usuário removido do bolão!" });
    }
    setRemovingMember(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <PageHeader title="Painel Admin" onBack={() => navigate("/")} />

      <main className="mx-auto w-full max-w-lg flex-1 p-4 pb-safe">
        <Tabs defaultValue="boloes">
          <TabsList className="tabs-list-scroll">
            <TabsTrigger value="boloes">Bolões</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="jogos">Jogos</TabsTrigger>
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
          </TabsList>

          {/* Bolão único */}
          <TabsContent value="boloes" className="space-y-4 pt-4">
            {boloes.map((bolao) => (
              <Card key={bolao.id}>
                <CardHeader>
                  <CardTitle className="text-base">{bolao.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Bolão único da aplicação — novos usuários entram automaticamente ao criar conta.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {members.length} participante(s) vinculado(s)
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => navigate(DEFAULT_BOLAO_PATH)}>
                    Abrir palpites e ranking
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Usuários Tab */}
          <TabsContent value="usuarios" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" /> Fotos de perfil
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Apenas administradores podem enviar ou alterar as fotos dos participantes.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {allProfiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado.</p>
                ) : (
                  allProfiles.map((profile) => (
                    <div
                      key={profile.user_id}
                      className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">@{profile.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {profile.avatar_url ? "Foto definida" : "Sem foto"}
                        </p>
                      </div>
                      <UserAvatarEditor
                        userId={profile.user_id}
                        username={profile.username}
                        avatarUrl={profile.avatar_url}
                        onUpdated={(avatarUrl) => {
                          setAllProfiles((prev) =>
                            prev.map((p) =>
                              p.user_id === profile.user_id ? { ...p, avatar_url: avatarUrl } : p
                            )
                          );
                          setMembers((prev) =>
                            prev.map((m) =>
                              m.user_id === profile.user_id ? { ...m, avatar_url: avatarUrl } : m
                            )
                          );
                        }}
                        compact
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" /> Participantes
                  <span className="text-xs font-normal text-muted-foreground">({members.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum participante ainda.</p>
                ) : (
                  members.map((m) => (
                    <div key={m.member_id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar username={m.username} avatarUrl={m.avatar_url} size="sm" />
                        <div>
                          <p className="text-sm font-medium">{m.username}</p>
                          <p className="text-xs text-muted-foreground">
                            Entrou em {format(new Date(m.joined_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => removeMember(m.member_id)}
                        disabled={removingMember === m.member_id}
                      >
                        {removingMember === m.member_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jogos" className="space-y-4 pt-4">
            <Button onClick={syncFixtures} disabled={syncing} className="w-full" variant="outline">
              {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Sincronizar jogos (API-Football)
            </Button>
            <Button onClick={syncResults} disabled={syncingResults} className="w-full" variant="secondary">
              {syncingResults ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Sincronizar Resultados (Teste)
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Adicionar Jogo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Mandante</Label>
                    <TeamSelect
                      value={matchForm.home_team}
                      onValueChange={(v) => setMatchForm({ ...matchForm, home_team: v })}
                      placeholder="Mandante"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Visitante</Label>
                    <TeamSelect
                      value={matchForm.away_team}
                      onValueChange={(v) => setMatchForm({ ...matchForm, away_team: v })}
                      placeholder="Visitante"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Data e hora</Label>
                  <Input
                    type="datetime-local"
                    value={matchForm.match_date}
                    onChange={(e) => setMatchForm({ ...matchForm, match_date: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Estádio</Label>
                    <Input
                      placeholder="MetLife Stadium"
                      value={matchForm.stadium}
                      onChange={(e) => setMatchForm({ ...matchForm, stadium: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Cidade</Label>
                    <Input
                      placeholder="Nova York"
                      value={matchForm.city}
                      onChange={(e) => setMatchForm({ ...matchForm, city: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Fase</Label>
                    <Select
                      value={matchForm.stage}
                      onValueChange={(v) => setMatchForm({ ...matchForm, stage: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stageOptions.map((s) => (
                          <SelectItem key={s} value={s}>
                            {stageLabels[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Grupo</Label>
                    <Input
                      placeholder="A"
                      value={matchForm.group_name}
                      onChange={(e) => setMatchForm({ ...matchForm, group_name: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Rodada (Brasileirão)</Label>
                  <Input
                    placeholder="Ex: Rodada 11"
                    value={matchForm.round_name}
                    onChange={(e) => setMatchForm({ ...matchForm, round_name: e.target.value })}
                  />
                </div>
                <Button onClick={createMatch} disabled={creatingMatch}>
                  {creatingMatch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Adicionar
                </Button>
              </CardContent>
            </Card>

            {/* Round bonus section */}
            {availableRounds.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pergunta bônus por rodada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground font-medium">Definir pergunta</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Rodada</Label>
                        <Select value={bonusRound} onValueChange={(v) => {
                          setBonusRound(v);
                          const roundMatch = matches.find(m => m.round_name === v && m.bonus_question);
                          setBonusRoundQuestion(roundMatch?.bonus_question || "Nenhuma");
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRounds.map(r => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Pergunta</Label>
                        <Select value={bonusRoundQuestion} onValueChange={setBonusRoundQuestion}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {bonusQuestionOptions.map(q => (
                              <SelectItem key={q} value={q}>{q}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button size="sm" onClick={saveRoundBonus} disabled={savingBonusRound || !bonusRound}>
                      {savingBonusRound ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Salvar pergunta da rodada
                    </Button>
                  </div>

                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Resultados Tab */}
          <TabsContent value="resultados" className="space-y-3 pt-4">
            <ResultsTab matches={matches} onSave={updateMatchResult} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const SeasonResultsEditor = () => {
  const { toast } = useToast();
  const competition = "copa_do_mundo_2026";
  const [champion, setChampion] = useState("");
  const [topScorer, setTopScorer] = useState("");
  const [bestPlayer, setBestPlayer] = useState("");
  const [revelationPlayer, setRevelationPlayer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("competition_season_results")
        .select("*")
        .eq("competition", competition)
        .maybeSingle();

      if (data) {
        setChampion(data.champion || "");
        setTopScorer(data.top_scorer || "");
        setBestPlayer(data.best_player || "");
        setRevelationPlayer(data.revelation_player || "");
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const saveResults = async () => {
    setSaving(true);
    const { error } = await supabase.from("competition_season_results").upsert({
      competition,
      champion: champion || null,
      top_scorer: topScorer || null,
      best_player: bestPlayer || null,
      revelation_player: revelationPlayer || null,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Resultados oficiais salvos!" });
    }
    setSaving(false);
  };

  const calculatePoints = async () => {
    setCalculating(true);
    const { data, error } = await supabase.rpc("calculate_season_prediction_points", {
      competition_input: competition,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Pontos calculados!",
        description: `${data} palpite(s) especial(is) atualizado(s).`,
      });
    }
    setCalculating(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Palpites Especiais — Resultados Oficiais</CardTitle>
        <p className="text-xs text-muted-foreground">
          Cada acerto vale {SEASON_PREDICTION_POINTS} pontos
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Campeão</Label>
          <TeamSelect value={champion} onValueChange={setChampion} placeholder="Selecione o campeão" />
        </div>
        <div>
          <Label className="text-xs">Artilheiro</Label>
          <Input value={topScorer} onChange={(e) => setTopScorer(e.target.value)} placeholder="Ex: Mbappé" />
        </div>
        <div>
          <Label className="text-xs">Melhor Jogador</Label>
          <Input value={bestPlayer} onChange={(e) => setBestPlayer(e.target.value)} placeholder="Ex: Vinícius Jr" />
        </div>
        <div>
          <Label className="text-xs">Jogador Revelação</Label>
          <Input value={revelationPlayer} onChange={(e) => setRevelationPlayer(e.target.value)} placeholder="Ex: Endrick" />
        </div>
        <div className="flex gap-2">
          <Button onClick={saveResults} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
          <Button onClick={calculatePoints} disabled={calculating} variant="secondary" className="flex-1">
            {calculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Calcular pontos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ResultsTab = ({
  matches,
  onSave,
}: {
  matches: Match[];
  onSave: (id: string, home: number, away: number, bonusResult?: boolean | null) => Promise<void>;
}) => {
  const [competition, setCompetition] = useState("copa_do_mundo_2026");

  const filteredMatches = matches.filter((m) =>
    competition === "brasileirao_2026" ? !!m.round_name : !m.round_name
  );

  const copaByRound = useMemo(
    () => groupByRoundKey(filteredMatches),
    [filteredMatches]
  );
  const copaRoundKeys = useMemo(
    () => orderedRoundKeys(copaByRound),
    [copaByRound]
  );

  const byRound: Record<string, Match[]> = {};
  if (competition === "brasileirao_2026") {
    filteredMatches.forEach((m) => {
      const round = m.round_name || "Sem rodada";
      if (!byRound[round]) byRound[round] = [];
      byRound[round].push(m);
    });
  }

  return (
    <div className="space-y-3">
      <Select value={competition} onValueChange={setCompetition}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="copa_do_mundo_2026">Copa do Mundo</SelectItem>
          <SelectItem value="brasileirao_2026">Brasileirão</SelectItem>
        </SelectContent>
      </Select>

      {competition === "copa_do_mundo_2026" && <SeasonResultsEditor />}

      {competition === "brasileirao_2026" ? (
        Object.entries(byRound).map(([round, roundMatches]) => (
          <div key={round} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">{round}</h3>
            {roundMatches.map((match) => (
              <MatchResultEditor key={match.id} match={match} onSave={onSave} />
            ))}
          </div>
        ))
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {copaRoundKeys.map((roundKey) => {
            const roundMatches = copaByRound[roundKey];
            return (
              <AccordionItem
                key={roundKey}
                value={roundKey}
                className="rounded-lg border bg-card px-3"
              >
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left text-sm font-semibold">
                    {getRoundLabelFromKey(roundKey)}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {roundMatches.length} jogos
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <RoundScorersEditor roundKey={roundKey} matches={roundMatches} />
                  {roundMatches.map((match) => (
                    <MatchResultEditor key={match.id} match={match} onSave={onSave} />
                  ))}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};

const MatchResultEditor = ({
  match,
  onSave,
}: {
  match: Match;
  onSave: (id: string, home: number, away: number, bonusResult?: boolean | null) => Promise<void>;
}) => {
  const [homeScore, setHomeScore] = useState(match.home_score?.toString() || "");
  const [awayScore, setAwayScore] = useState(match.away_score?.toString() || "");
  const [saving, setSaving] = useState(false);
  const bonusQ = (match as any).bonus_question as string | null;
  const [bonusResult, setBonusResult] = useState<string>(
    (match as any).bonus_result === true ? "sim" : (match as any).bonus_result === false ? "nao" : ""
  );

  // Sync state when match prop changes (after parent updates)
  useEffect(() => {
    setHomeScore(match.home_score?.toString() || "");
    setAwayScore(match.away_score?.toString() || "");
    setBonusResult(
      (match as any).bonus_result === true ? "sim" : (match as any).bonus_result === false ? "nao" : ""
    );
  }, [match.home_score, match.away_score, (match as any).bonus_result]);

  const handleSave = async () => {
    const h = parseInt(homeScore);
    const a = parseInt(awayScore);
    if (isNaN(h) || isNaN(a)) return;
    setSaving(true);
    const br = bonusResult === "sim" ? true : bonusResult === "nao" ? false : null;
    await onSave(match.id, h, a, br);
    setSaving(false);
  };

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <MatchTeamsDisplay
          homeTeam={match.home_team}
          awayTeam={match.away_team}
          size={32}
          style="shiny"
        />
        <p className="text-xs text-muted-foreground">
          {new Date(match.match_date).toLocaleDateString("pt-BR")}
          {match.is_finished && " • ✅ Resultado salvo"}
        </p>
        <div className="flex items-center justify-center gap-2">
          <Input
            type="number"
            min="0"
            placeholder="0"
            inputMode="numeric"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="score-input"
          />
          <span className="text-sm font-bold">×</span>
          <Input
            type="number"
            min="0"
            placeholder="0"
            inputMode="numeric"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="score-input"
          />
        </div>
        <Button
          className="w-full"
          disabled={saving || homeScore === "" || awayScore === ""}
          onClick={handleSave}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar resultado
            </>
          )}
        </Button>
        {bonusQ && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{bonusQ}</p>
            <Select value={bonusResult} onValueChange={setBonusResult}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Resposta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Admin;
