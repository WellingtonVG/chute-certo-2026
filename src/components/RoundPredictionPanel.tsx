import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { MatchTeamsDisplay } from "@/components/CountryFlag";
import { formatDeadline } from "@/lib/prediction-deadlines";
import {
  formatDayLabel,
  getRoundScorerName,
  getScorerMatchForRound,
  isRoundOpen,
} from "@/lib/match-stages";
import squads from "@/data/squads.json";

type Match = Tables<"matches">;
type Prediction = Tables<"predictions">;

type ScoreEntry = { home: string; away: string };

interface RoundPredictionPanelProps {
  dayKey: string;
  matches: Match[];
  predictions: Record<string, Prediction>;
  saving: boolean;
  forceEditable?: boolean;
  onSaveRound: (
    roundMatches: Match[],
    scores: Record<string, { home: number; away: number }>,
    scorerName: string
  ) => Promise<void>;
}

const RoundPredictionPanel = ({
  dayKey,
  matches,
  predictions,
  saving,
  forceEditable = false,
  onSaveRound,
}: RoundPredictionPanelProps) => {
  const roundOpen = forceEditable || isRoundOpen(matches);
  const roundLabel = formatDayLabel(dayKey, matches);
  const deadlineMatch = getScorerMatchForRound(matches);
  const deadlineDate = new Date(deadlineMatch.match_date);

  const [scores, setScores] = useState<Record<string, ScoreEntry>>(() =>
    Object.fromEntries(
      matches.map((m) => [
        m.id,
        {
          home: predictions[m.id]?.home_score?.toString() ?? "",
          away: predictions[m.id]?.away_score?.toString() ?? "",
        },
      ])
    )
  );
  const [scorer, setScorer] = useState(() => getRoundScorerName(matches, predictions));
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scorerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setScores(
      Object.fromEntries(
        matches.map((m) => [
          m.id,
          {
            home: predictions[m.id]?.home_score?.toString() ?? "",
            away: predictions[m.id]?.away_score?.toString() ?? "",
          },
        ])
      )
    );
    setScorer(getRoundScorerName(matches, predictions));
  }, [matches, predictions]);

  const squadPlayers = useMemo(() => {
    const s = squads as Record<string, string[]>;
    const teams = new Set(matches.flatMap((m) => [m.home_team, m.away_team]));
    return [...teams]
      .flatMap((team) => s[team] ?? [])
      .filter((name, i, arr) => arr.indexOf(name) === i)
      .sort((a, b) => a.localeCompare(b));
  }, [matches]);

  const filledCount = matches.filter((m) => {
    const s = scores[m.id];
    if (!s) return false;
    const h = parseInt(s.home, 10);
    const a = parseInt(s.away, 10);
    return !isNaN(h) && !isNaN(a) && h >= 0 && a >= 0;
  }).length;

  const allScoresFilled = filledCount === matches.length;
  const scorerRequired = !forceEditable;
  const canSubmit =
    roundOpen &&
    allScoresFilled &&
    (!scorerRequired || scorer.trim().length > 0);

  const handleSave = async () => {
    if (!canSubmit) return;
    const parsed: Record<string, { home: number; away: number }> = {};
    for (const m of matches) {
      const s = scores[m.id];
      const h = parseInt(s.home, 10);
      const a = parseInt(s.away, 10);
      parsed[m.id] = { home: h, away: a };
    }
    await onSaveRound(matches, parsed, scorer.trim());
  };

  const updateScore = (matchId: string, side: "home" | "away", value: string) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [side]: value },
    }));
  };

  const roundScorer = getRoundScorerName(matches, predictions);
  const hasAnyPrediction = matches.some((m) => predictions[m.id]);

  return (
    <Card className={!roundOpen ? "opacity-80" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{roundLabel}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {matches.length} jogos · Palpite da rodada inteira
        </p>
        {forceEditable ? (
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
            Modo admin — prazo ignorado
          </p>
        ) : roundOpen ? (
          <p className="text-xs text-muted-foreground">
            Prazo: até {formatDeadline(deadlineDate)} (início do 1º jogo)
          </p>
        ) : (
          <p className="text-xs font-medium text-muted-foreground">Rodada encerrada</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {matches.map((match) => {
          const pred = predictions[match.id];
          const matchDate = new Date(match.match_date);
          const entry = scores[match.id];

          return (
            <div key={match.id} className="rounded-lg border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <MatchTeamsDisplay
                  homeTeam={match.home_team}
                  awayTeam={match.away_team}
                  size={48}
                  style="shiny"
                />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {matchDate.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Sao_Paulo",
                  })}
                </span>
              </div>

              {match.is_finished && (
                <p className="mb-2 text-sm font-bold text-accent">
                  Resultado: {match.home_score} × {match.away_score}
                </p>
              )}

              {!roundOpen ? (
                pred ? (
                  <div className="space-y-1 text-sm">
                    <p>
                      Palpite:{" "}
                      <span className="font-bold">
                        {pred.home_score} × {pred.away_score}
                      </span>
                    </p>
                    {pred.points !== null && (
                      <p className="font-bold text-accent">+{pred.points ?? 0} pts</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem palpite</p>
                )
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    placeholder="0"
                    inputMode="numeric"
                    value={entry?.home ?? ""}
                    onChange={(e) => updateScore(match.id, "home", e.target.value)}
                    className="w-16 text-center"
                  />
                  <span className="text-sm font-bold">×</span>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    placeholder="0"
                    inputMode="numeric"
                    value={entry?.away ?? ""}
                    onChange={(e) => updateScore(match.id, "away", e.target.value)}
                    className="w-16 text-center"
                  />
                </div>
              )}
            </div>
          );
        })}

        {!roundOpen && roundScorer && (
          <p className="text-sm">
            Goleador da rodada: <span className="font-medium">{roundScorer}</span>
            {(() => {
              const scorerMatch = getScorerMatchForRound(matches);
              const sp = predictions[scorerMatch.id]?.scorer_points;
              return sp !== null && sp !== undefined ? (
                <span className="ml-2 font-bold text-accent">
                  ({sp > 0 ? "+" : ""}
                  {sp} pts goleador)
                </span>
              ) : null;
            })()}
          </p>
        )}

        {roundOpen && (
          <>
            <div className="relative border-t pt-3">
              <p className="mb-2 text-sm font-medium">Goleador da rodada</p>
              <Input
                ref={scorerRef}
                placeholder={
                  forceEditable
                    ? "Goleador da rodada (opcional)"
                    : "Escolha 1 jogador que marca nesta rodada"
                }
                value={scorer}
                onFocus={() => setSuggestions(squadPlayers)}
                onChange={(e) => {
                  setScorer(e.target.value);
                  const q = e.target.value.toLowerCase();
                  setSuggestions(
                    q.length === 0
                      ? squadPlayers
                      : squadPlayers.filter((p) => p.toLowerCase().includes(q)).slice(0, 8)
                  );
                }}
                onBlur={() => setTimeout(() => setSuggestions([]), 150)}
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                  {suggestions.map((p) => (
                    <li
                      key={p}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setScorer(p);
                        setSuggestions([]);
                      }}
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              {filledCount}/{matches.length} jogos preenchidos
              {scorerRequired &&
                !scorer.trim() &&
                filledCount === matches.length &&
                " · Informe o goleador"}
            </p>

            <Button className="w-full" onClick={handleSave} disabled={!canSubmit || saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : forceEditable ? (
                "Salvar palpite do participante"
              ) : hasAnyPrediction ? (
                "Atualizar palpites da rodada"
              ) : (
                "Salvar palpites da rodada"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RoundPredictionPanel;
