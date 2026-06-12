import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { getRoundLabelFromKey, getScorerPointsForRound } from "@/lib/copa-rounds";
import {
  fetchRegularScorersForRound,
  getSquadPlayersForMatches,
  saveRoundRegularScorers,
} from "@/lib/match-goals";
import { useToast } from "@/hooks/use-toast";

type Match = Tables<"matches">;

interface RoundScorersEditorProps {
  roundKey: string;
  matches: Match[];
}

const RoundScorersEditor = ({ roundKey, matches }: RoundScorersEditorProps) => {
  const { toast } = useToast();
  const [scorers, setScorers] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const matchIds = useMemo(() => matches.map((m) => m.id), [matches]);
  const squadPlayers = useMemo(() => getSquadPlayersForMatches(matches), [matches]);
  const scorerPoints = getScorerPointsForRound(roundKey);
  const finishedCount = matches.filter((m) => m.is_finished).length;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const names = await fetchRegularScorersForRound(matchIds);
      if (!cancelled) {
        setScorers(names);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [matchIds.join(",")]);

  const filteredSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const selected = new Set(scorers.map((s) => s.toLowerCase()));
    return squadPlayers
      .filter((p) => !selected.has(p.toLowerCase()))
      .filter((p) => !q || p.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, squadPlayers, scorers]);

  const addScorer = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (scorers.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    setScorers((prev) => [...prev, trimmed].sort((a, b) => a.localeCompare(b)));
    setQuery("");
    setShowSuggestions(false);
  };

  const removeScorer = (name: string) => {
    setScorers((prev) => prev.filter((s) => s !== name));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await saveRoundRegularScorers(roundKey, matches, scorers);
    setSaving(false);

    if (error) {
      toast({
        title: "Erro ao salvar goleadores",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Goleadores da rodada salvos",
      description: "Pontos do palpite de jogador da rodada recalculados.",
    });
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Jogadores que marcaram gol — {getRoundLabelFromKey(roundKey)}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Selecione quem marcou gol válido nesta rodada (+{scorerPoints} pts para quem acertou o
          palpite). Não inclua gol contra nem gol em disputa de pênaltis.
        </p>
        <p className="text-xs text-muted-foreground">
          {finishedCount}/{matches.length} jogos com resultado registrado
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {scorers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {scorers.map((name) => (
                  <Badge key={name} variant="secondary" className="gap-1 pr-1">
                    {name}
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-muted"
                      onClick={() => removeScorer(name)}
                      aria-label={`Remover ${name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="relative">
              <Input
                placeholder="Buscar jogador da rodada..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) {
                    e.preventDefault();
                    addScorer(query);
                  }
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                  {filteredSuggestions.map((p) => (
                    <li
                      key={p}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addScorer(p);
                      }}
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {filteredSuggestions.length > 0 && query.length === 0 && scorers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Toque no campo acima para ver jogadores dos times desta rodada.
              </p>
            )}

            <Button size="sm" onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar goleadores e recalcular pontos
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RoundScorersEditor;
