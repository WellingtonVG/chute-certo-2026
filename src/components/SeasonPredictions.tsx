import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Trophy, Star, Target, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CountryLabel } from "@/components/CountryFlag";
import { TeamSelect } from "@/components/TeamSelect";
import { SEASON_PREDICTION_POINTS } from "@/lib/season-predictions";
import {
  getSeasonPredictionsDeadlineLabel,
  isSeasonPredictionOpen,
} from "@/lib/prediction-deadlines";
import squads from "@/data/squads.json";

interface SeasonPredictionsProps {
  bolaoId: string;
  userId: string;
}

const PlayerInput = ({
  label,
  icon: Icon,
  placeholder,
  value,
  onChange,
  allPlayers,
}: {
  label: string;
  icon: typeof Star;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  allPlayers: string[];
}) => {
  const [filtered, setFiltered] = useState<string[]>([]);

  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
        <span className="ml-auto text-accent">{SEASON_PREDICTION_POINTS} pts</span>
      </label>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            const q = e.target.value.toLowerCase();
            setFiltered(
              q.length >= 3
                ? allPlayers.filter((p) => p.toLowerCase().includes(q)).slice(0, 8)
                : []
            );
          }}
          onBlur={() => setTimeout(() => setFiltered([]), 150)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setFiltered([]);
          }}
        />
        {filtered.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
            {filtered.map((p) => (
              <li
                key={p}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(p);
                  setFiltered([]);
                }}
              >
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const SeasonPredictions = ({ bolaoId, userId }: SeasonPredictionsProps) => {
  const { toast } = useToast();
  const [champion, setChampion] = useState("");
  const [bestPlayer, setBestPlayer] = useState("");
  const [topScorer, setTopScorer] = useState("");
  const [revelationPlayer, setRevelationPlayer] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingId, setExistingId] = useState<string | null>(null);

  const locked = !isSeasonPredictionOpen();
  const deadlineLabel = getSeasonPredictionsDeadlineLabel();

  const allPlayers = useMemo(
    () => Object.values(squads as Record<string, string[]>).flat().sort((a, b) => a.localeCompare(b)),
    []
  );

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
        setBestPlayer(data.best_player || "");
        setRevelationPlayer(data.revelation_player || "");
        setExistingId(data.id);
      }
      setLoading(false);
    };
    fetch();
  }, [bolaoId, userId]);

  const handleSave = async () => {
    if (!champion && !bestPlayer && !topScorer && !revelationPlayer) return;
    if (locked) {
      toast({
        title: "Prazo encerrado",
        description: `Palpites especiais travaram em ${deadlineLabel}.`,
        variant: "destructive",
      });
      return;
    }
    setSaving(true);

    const payload = {
      champion: champion || null,
      top_scorer: topScorer || null,
      best_player: bestPlayer || null,
      revelation_player: revelationPlayer || null,
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
      setBestPlayer(data.best_player || "");
      setRevelationPlayer(data.revelation_player || "");
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
        <p className="text-xs text-muted-foreground">
          {locked
            ? `Prazo encerrado em ${deadlineLabel}`
            : `Prazo: até ${deadlineLabel}`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {locked ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" />
              <span>Campeão:</span>
              <span className="font-bold">
                {champion ? <CountryLabel teamName={champion} /> : "—"}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">{SEASON_PREDICTION_POINTS} pts</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" />
              <span>Melhor Jogador:</span>
              <span className="font-bold">{bestPlayer || "—"}</span>
              <span className="ml-auto text-xs text-muted-foreground">{SEASON_PREDICTION_POINTS} pts</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              <span>Artilheiro:</span>
              <span className="font-bold">{topScorer || "—"}</span>
              <span className="ml-auto text-xs text-muted-foreground">{SEASON_PREDICTION_POINTS} pts</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Jogador Revelação:</span>
              <span className="font-bold">{revelationPlayer || "—"}</span>
              <span className="ml-auto text-xs text-muted-foreground">{SEASON_PREDICTION_POINTS} pts</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Trophy className="h-3.5 w-3.5" /> Campeão da Copa
                <span className="ml-auto text-accent">{SEASON_PREDICTION_POINTS} pts</span>
              </label>
              <TeamSelect value={champion} onValueChange={setChampion} />
            </div>
            <PlayerInput
              label="Melhor Jogador da Copa"
              icon={Star}
              placeholder="Ex: Vinícius Jr"
              value={bestPlayer}
              onChange={setBestPlayer}
              allPlayers={allPlayers}
            />
            <PlayerInput
              label="Artilheiro da Copa"
              icon={Target}
              placeholder="Ex: Mbappé"
              value={topScorer}
              onChange={setTopScorer}
              allPlayers={allPlayers}
            />
            <PlayerInput
              label="Jogador Revelação"
              icon={Sparkles}
              placeholder="Ex: Endrick"
              value={revelationPlayer}
              onChange={setRevelationPlayer}
              allPlayers={allPlayers}
            />
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
