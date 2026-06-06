import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Lock, Trophy, Star, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFlag, allTeams } from "@/lib/country-flags";
import squads from "@/data/squads.json";

interface SeasonPredictionsProps {
  bolaoId: string;
  userId: string;
  firstMatchDate: string | null; // ISO string of earliest match
}

const SeasonPredictions = ({ bolaoId, userId, firstMatchDate }: SeasonPredictionsProps) => {
  const { toast } = useToast();
  const [champion, setChampion] = useState("");
  const [bestPlayer, setBestPlayer] = useState("");
  const [topScorer, setTopScorer] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [bestPlayerSuggestions, setBestPlayerSuggestions] = useState<string[]>([]);
  const [topScorerSuggestions, setTopScorerSuggestions] = useState<string[]>([]);

  const locked = firstMatchDate ? new Date(firstMatchDate) <= new Date() : false;

  const allPlayers = useMemo(() =>
    Object.values(squads as Record<string, string[]>).flat().sort((a, b) => a.localeCompare(b))
  , []);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("season_predictions")
        .select("*")
        .eq("bolao_id", bolaoId)
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setChampion(data.champion || "");
        setTopScorer(data.top_scorer || "");
        setBestPlayer((data as any).best_player || "");
        setExistingId(data.id);
      }
      setLoading(false);
    };
    fetch();
  }, [bolaoId, userId]);

  const handleSave = async () => {
    if (!champion && !bestPlayer && !topScorer) return;
    setSaving(true);

    const payload: any = {
      champion: champion || null,
      top_scorer: topScorer || null,
      best_player: bestPlayer || null,
    };

    if (existingId) {
      await supabase.from("season_predictions").update(payload).eq("id", existingId);
    } else {
      await supabase.from("season_predictions").insert({
        ...payload,
        bolao_id: bolaoId,
        user_id: userId,
      });
    }

    // Refresh
    const { data } = await supabase
      .from("season_predictions")
      .select("*")
      .eq("bolao_id", bolaoId)
      .eq("user_id", userId)
      .maybeSingle();
    if (data) {
      setExistingId(data.id);
      setChampion(data.champion || "");
      setTopScorer(data.top_scorer || "");
      setBestPlayer((data as any).best_player || "");
    }

    setSaving(false);
    toast({ title: "Palpites especiais salvos!" });
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
    <Card className={locked ? "opacity-70" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="h-4 w-4 text-accent" />
          Palpites Especiais
          {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {locked ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" />
              <span>Campeão:</span>
              <span className="font-bold">{champion ? <><span className="emoji-flag">{getFlag(champion)}</span> {champion}</> : "—"}</span>
              <span className="ml-auto text-xs text-muted-foreground">30 pts</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" />
              <span>Melhor Jogador:</span>
              <span className="font-bold">{bestPlayer || "—"}</span>
              <span className="ml-auto text-xs text-muted-foreground">25 pts</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              <span>Artilheiro:</span>
              <span className="font-bold">{topScorer || "—"}</span>
              <span className="ml-auto text-xs text-muted-foreground">20 pts</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Trophy className="h-3.5 w-3.5" /> Campeão da Copa
                <span className="ml-auto text-accent">30 pts</span>
              </label>
              <Select value={champion} onValueChange={setChampion}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a seleção" />
                </SelectTrigger>
                <SelectContent>
                  {allTeams.map((team) => (
                    <SelectItem key={team} value={team}>
                      <span className="emoji-flag">{getFlag(team)}</span> {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Star className="h-3.5 w-3.5" /> Melhor Jogador da Copa
                <span className="ml-auto text-accent">25 pts</span>
              </label>
              <div className="relative">
                <Input
                  placeholder="Ex: Vinícius Jr"
                  value={bestPlayer}
                  onChange={(e) => {
                    setBestPlayer(e.target.value);
                    const q = e.target.value.toLowerCase();
                    setBestPlayerSuggestions(q.length >= 3
                      ? allPlayers.filter(p => p.toLowerCase().includes(q)).slice(0, 8)
                      : []);
                  }}
                  onBlur={() => setTimeout(() => setBestPlayerSuggestions([]), 150)}
                  onKeyDown={(e) => { if (e.key === "Escape") setBestPlayerSuggestions([]); }}
                />
                {bestPlayerSuggestions.length > 0 && (
                  <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                    {bestPlayerSuggestions.map((p) => (
                      <li
                        key={p}
                        className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onMouseDown={(e) => { e.preventDefault(); setBestPlayer(p); setBestPlayerSuggestions([]); }}
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Target className="h-3.5 w-3.5" /> Artilheiro da Copa
                <span className="ml-auto text-accent">20 pts</span>
              </label>
              <div className="relative">
                <Input
                  placeholder="Ex: Mbappé"
                  value={topScorer}
                  onChange={(e) => {
                    setTopScorer(e.target.value);
                    const q = e.target.value.toLowerCase();
                    setTopScorerSuggestions(q.length >= 3
                      ? allPlayers.filter(p => p.toLowerCase().includes(q)).slice(0, 8)
                      : []);
                  }}
                  onBlur={() => setTimeout(() => setTopScorerSuggestions([]), 150)}
                  onKeyDown={(e) => { if (e.key === "Escape") setTopScorerSuggestions([]); }}
                />
                {topScorerSuggestions.length > 0 && (
                  <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                    {topScorerSuggestions.map((p) => (
                      <li
                        key={p}
                        className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onMouseDown={(e) => { e.preventDefault(); setTopScorer(p); setTopScorerSuggestions([]); }}
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <Button size="sm" onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Palpites Especiais"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SeasonPredictions;
