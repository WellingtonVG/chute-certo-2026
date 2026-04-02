import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Loader2, Copy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";

type Match = Tables<"matches">;
type Bolao = Tables<"boloes">;

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

  // New bolao form
  const [newBolaoName, setNewBolaoName] = useState("");
  const [creatingBolao, setCreatingBolao] = useState(false);

  // New match form
  const [matchForm, setMatchForm] = useState({
    home_team: "",
    away_team: "",
    match_date: "",
    stadium: "",
    city: "",
    stage: "group" as string,
    group_name: "",
  });
  const [creatingMatch, setCreatingMatch] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    const fetchData = async () => {
      const [boloesRes, matchesRes] = await Promise.all([
        supabase.from("boloes").select("*").order("created_at", { ascending: false }),
        supabase.from("matches").select("*").order("match_date", { ascending: true }),
      ]);
      setBoloes(boloesRes.data || []);
      setMatches(matchesRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [isAdmin, navigate]);

  const createBolao = async () => {
    if (!user || !newBolaoName.trim()) return;
    setCreatingBolao(true);
    const { data, error } = await supabase
      .from("boloes")
      .insert({ name: newBolaoName.trim(), created_by: user.id })
      .select()
      .single();

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else if (data) {
      // Admin auto-joins
      await supabase.from("bolao_members").insert({ bolao_id: data.id, user_id: user.id });
      setBoloes((prev) => [data, ...prev]);
      setNewBolaoName("");
      toast({ title: "Bolão criado!" });
    }
    setCreatingBolao(false);
  };

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
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else if (data) {
      setMatches((prev) => [...prev, data].sort((a, b) => a.match_date.localeCompare(b.match_date)));
      setMatchForm({ home_team: "", away_team: "", match_date: "", stadium: "", city: "", stage: "group", group_name: "" });
      toast({ title: "Jogo criado!" });
    }
    setCreatingMatch(false);
  };

  const updateMatchResult = async (matchId: string, homeScore: number, awayScore: number) => {
    const { error } = await supabase
      .from("matches")
      .update({ home_score: homeScore, away_score: awayScore, is_finished: true, is_manual_override: true })
      .eq("id", matchId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, home_score: homeScore, away_score: awayScore, is_finished: true, is_manual_override: true }
            : m
        )
      );
      toast({ title: "Resultado atualizado!" });
    }
  };

  const copyInviteLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/convite/${code}`);
    toast({ title: "Link copiado!" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-primary px-4 py-4 text-primary-foreground">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Painel Admin</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 p-4">
        <Tabs defaultValue="boloes">
          <TabsList className="w-full">
            <TabsTrigger value="boloes" className="flex-1">Bolões</TabsTrigger>
            <TabsTrigger value="jogos" className="flex-1">Jogos</TabsTrigger>
            <TabsTrigger value="resultados" className="flex-1">Resultados</TabsTrigger>
          </TabsList>

          {/* Bolões Tab */}
          <TabsContent value="boloes" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Criar Bolão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Nome do bolão"
                  value={newBolaoName}
                  onChange={(e) => setNewBolaoName(e.target.value)}
                />
                <Button onClick={createBolao} disabled={creatingBolao || !newBolaoName.trim()}>
                  {creatingBolao ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Criar
                </Button>
              </CardContent>
            </Card>

            {boloes.map((bolao) => (
              <Card key={bolao.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{bolao.name}</p>
                    <p className="text-xs text-muted-foreground">Código: {bolao.invite_code}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyInviteLink(bolao.invite_code)}>
                    <Copy className="mr-1 h-3 w-3" /> Link
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Jogos Tab */}
          <TabsContent value="jogos" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Adicionar Jogo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Mandante</Label>
                    <Input
                      placeholder="Brasil"
                      value={matchForm.home_team}
                      onChange={(e) => setMatchForm({ ...matchForm, home_team: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Visitante</Label>
                    <Input
                      placeholder="Argentina"
                      value={matchForm.away_team}
                      onChange={(e) => setMatchForm({ ...matchForm, away_team: e.target.value })}
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
                <div className="grid grid-cols-2 gap-2">
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
                <div className="grid grid-cols-2 gap-2">
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
                <Button onClick={createMatch} disabled={creatingMatch}>
                  {creatingMatch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Adicionar
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resultados Tab */}
          <TabsContent value="resultados" className="space-y-3 pt-4">
            {matches.map((match) => (
              <MatchResultEditor key={match.id} match={match} onSave={updateMatchResult} />
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const MatchResultEditor = ({
  match,
  onSave,
}: {
  match: Match;
  onSave: (id: string, home: number, away: number) => void;
}) => {
  const [homeScore, setHomeScore] = useState(match.home_score?.toString() || "");
  const [awayScore, setAwayScore] = useState(match.away_score?.toString() || "");

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <p className="text-sm font-medium">
          {match.home_team} vs {match.away_team}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(match.match_date).toLocaleDateString("pt-BR")}
          {match.is_finished && " • ✅ Finalizado"}
          {match.is_manual_override && " • Manual"}
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="w-16 text-center"
          />
          <span className="text-sm font-bold">×</span>
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="w-16 text-center"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const h = parseInt(homeScore);
              const a = parseInt(awayScore);
              if (!isNaN(h) && !isNaN(a)) onSave(match.id, h, a);
            }}
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Admin;
