import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { MatchTeamsDisplay } from "@/components/CountryFlag";
import {
  formatDeadline,
  formatMatchDateTime,
  isMatchPredictionOpen,
  isMatchToday,
  matchTodayHighlightClass,
} from "@/lib/prediction-deadlines";
import { cn } from "@/lib/utils";
import { getScorerPointsForRound } from "@/lib/copa-rounds";
import {
  getRoundLabel,
  getRoundScorerName,
  getScorerMatchForRound,
  isRoundOpen,
} from "@/lib/match-stages";
import type { RoundPrediction } from "@/lib/round-predictions";
import squads from "@/data/squads.json";

type Match = Tables<"matches">;
type Prediction = Tables<"predictions">;

type ScoreEntry = { home: string; away: string };

interface RoundPredictionPanelProps {
  roundKey: string;
  matches: Match[];
  predictions: Record<string, Prediction>;
  roundPredictions: Record<string, RoundPrediction>;
  usedScorerNames: Set<string>;
  savingMatchId: string | null;
  savingScorer: boolean;
  forceEditable?: boolean;
  readOnly?: boolean;
  onSaveRound: (
    roundKey: string,
    roundMatches: Match[],
    scores: Record<string, { home: number; away: number }>,
    scorerName: string
  ) => Promise<void>;
}

const RoundPredictionPanel = ({
  roundKey,
  matches,
  predictions,
  roundPredictions,
  usedScorerNames,
  savingMatchId,
  savingScorer,
  forceEditable = false,
  readOnly = false,
  onSaveRound,
}: RoundPredictionPanelProps) => {
  const roundScorerOpen = isRoundOpen(matches);
  const roundLabel = getRoundLabel(roundKey, matches);
  const deadlineMatch = getScorerMatchForRound(matches);
  const deadlineDate = new Date(deadlineMatch.match_date);
  const scorerPoints = getScorerPointsForRound(roundKey);
  const openMatches = useMemo(
    () => matches.filter((m) => forceEditable || isMatchPredictionOpen(m.match_date)),
    [matches, forceEditable]
  );
  const hasOpenMatches = openMatches.length > 0;
  const canEdit =
    forceEditable || (!readOnly && (hasOpenMatches || roundScorerOpen));

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
  const [scorer, setScorer] = useState(() => getRoundScorerName(roundKey, roundPredictions));
  const [scorerError, setScorerError] = useState("");
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
    setScorer(getRoundScorerName(roundKey, roundPredictions));
    setScorerError("");
  }, [matches, predictions, roundKey, roundPredictions]);

  const squadPlayers = useMemo(() => {
    const s = squads as Record<string, string[]>;
    const teams = new Set(matches.flatMap((m) => [m.home_team, m.away_team]));
    return [...teams]
      .flatMap((team) => s[team] ?? [])
      .filter((name, i, arr) => arr.indexOf(name) === i)
      .sort((a, b) => a.localeCompare(b));
  }, [matches]);

  const isScoreFilled = (matchId: string) => {
    const s = scores[matchId];
    if (!s) return false;
    const h = parseInt(s.home, 10);
    const a = parseInt(s.away, 10);
    return !isNaN(h) && !isNaN(a) && h >= 0 && a >= 0;
  };

  const roundScorer = getRoundScorerName(roundKey, roundPredictions);
  const roundScorerPoints = roundPredictions[roundKey]?.scorer_points;

  const isMatchDirty = (matchId: string) => {
    const s = scores[matchId];
    const pred = predictions[matchId];
    const home = s?.home ?? "";
    const away = s?.away ?? "";
    const savedHome = pred?.home_score?.toString() ?? "";
    const savedAway = pred?.away_score?.toString() ?? "";
    return home !== savedHome || away !== savedAway;
  };

  const scorerDirty = scorer.trim() !== (roundScorer || "");
  const scorerDuplicate =
    scorer.trim().length > 0 && usedScorerNames.has(scorer.trim().toLowerCase());
  const showScorerEditor = roundScorerOpen || forceEditable;
  const canSaveScorer =
    showScorerEditor &&
    scorer.trim().length > 0 &&
    (forceEditable || !scorerDuplicate) &&
    (forceEditable || scorerDirty);

  const handleSaveMatch = async (matchId: string) => {
    if (!isScoreFilled(matchId)) return;
    const s = scores[matchId];
    const h = parseInt(s.home, 10);
    const a = parseInt(s.away, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    await onSaveRound(roundKey, matches, { [matchId]: { home: h, away: a } }, "");
  };

  const handleSaveScorer = async () => {
    if (!canSaveScorer) return;
    await onSaveRound(roundKey, matches, {}, scorer.trim());
  };

  const updateScore = (matchId: string, side: "home" | "away", value: string) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [side]: value },
    }));
  };

  return (
    <Card className={!canEdit ? "opacity-80" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{roundLabel}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {matches.length} jogos · Salve cada jogo separadamente · Artilheiro +{scorerPoints} pts
        </p>
        {readOnly && !forceEditable ? (
          <p className="text-xs font-medium text-muted-foreground">Palpites de outro participante</p>
        ) : forceEditable ? (
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
            Modo admin — prazo ignorado
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Resultados: cada jogo fecha no horário do seu início
            </p>
            {roundScorerOpen ? (
              <p className="text-xs text-muted-foreground">
                Artilheiro da rodada: até {formatDeadline(deadlineDate)} (início do 1º jogo)
              </p>
            ) : (
              <p className="text-xs font-medium text-muted-foreground">
                Prazo do artilheiro encerrado
              </p>
            )}
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {matches.map((match) => {
          const pred = predictions[match.id];
          const entry = scores[match.id];
          const today = isMatchToday(match.match_date);
          const matchOpen = forceEditable || isMatchPredictionOpen(match.match_date);

          return (
            <div
              key={match.id}
              className={cn(
                "rounded-lg border bg-background p-3",
                today && matchTodayHighlightClass
              )}
            >
              <div className="mb-2">
                <MatchTeamsDisplay
                  homeTeam={match.home_team}
                  awayTeam={match.away_team}
                  size={48}
                  style="shiny"
                  dateTime={formatMatchDateTime(match.match_date)}
                  dateTimeClassName={
                    today ? "font-medium text-green-700 dark:text-green-400" : undefined
                  }
                />
              </div>

              {match.is_finished && (
                <p className="mb-2 text-sm font-bold text-accent">
                  Resultado: {match.home_score} × {match.away_score}
                </p>
              )}

              {!matchOpen ? (
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
                <>
                  <div className="flex items-center justify-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      placeholder="0"
                      inputMode="numeric"
                      value={entry?.home ?? ""}
                      onChange={(e) => updateScore(match.id, "home", e.target.value)}
                      className="score-input"
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
                      className="score-input"
                    />
                  </div>
                  {isMatchDirty(match.id) && (
                    <Button
                      className="mt-2 w-full"
                      size="sm"
                      onClick={() => handleSaveMatch(match.id)}
                      disabled={!isScoreFilled(match.id) || savingMatchId === match.id}
                    >
                      {savingMatchId === match.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : pred ? (
                        "Atualizar palpite"
                      ) : (
                        "Salvar palpite"
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        })}

        {!showScorerEditor && roundScorer && (
          <p className="text-sm">
            Jogador da rodada: <span className="font-medium">{roundScorer}</span>
            {roundScorerPoints !== null && roundScorerPoints !== undefined && (
              <span className="ml-2 font-bold text-accent">
                ({roundScorerPoints > 0 ? "+" : ""}
                {roundScorerPoints} pts)
              </span>
            )}
          </p>
        )}

        {canEdit && (
          <>
            {showScorerEditor && (
            <div className="relative border-t pt-3">
              <p className="mb-2 text-sm font-medium">
                Jogador da rodada (+{scorerPoints} pts)
              </p>
              <p className="mb-2 text-xs text-muted-foreground">
                Escolha 1 jogador por rodada. Se ele marcar pelo menos um gol naquela rodada, você
                pontua. Não vale gol contra nem gol em disputa de pênaltis.
                {forceEditable && " No modo admin, o prazo é ignorado."}
              </p>
              <Input
                ref={scorerRef}
                placeholder={
                  forceEditable
                    ? "Jogador da rodada (opcional)"
                    : "Jogador que marca nesta rodada"
                }
                value={scorer}
                onFocus={() => setSuggestions(squadPlayers)}
                onChange={(e) => {
                  const value = e.target.value;
                  setScorer(value);
                  setScorerError("");
                  const q = value.toLowerCase();
                  setSuggestions(
                    q.length === 0
                      ? squadPlayers
                      : squadPlayers.filter((p) => p.toLowerCase().includes(q)).slice(0, 8)
                  );
                  if (value.trim() && !forceEditable && usedScorerNames.has(value.trim().toLowerCase())) {
                    setScorerError("Este jogador já foi usado em outra rodada.");
                  }
                }}
                onBlur={() => setTimeout(() => setSuggestions([]), 150)}
              />
              {scorerError && (
                <p className="mt-1 text-xs text-destructive">{scorerError}</p>
              )}
              {usedScorerNames.size > 0 && !forceEditable && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Cada jogador só pode ser escolhido uma vez no bolão.
                </p>
              )}
              {forceEditable && roundScorer && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Palpite atual: <span className="font-medium">{roundScorer}</span>
                  {roundScorerPoints !== null && roundScorerPoints !== undefined && (
                    <span className="ml-1 text-accent">
                      ({roundScorerPoints > 0 ? "+" : ""}
                      {roundScorerPoints} pts)
                    </span>
                  )}
                </p>
              )}
              {suggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                  {suggestions.map((p) => {
                    const used = usedScorerNames.has(p.toLowerCase());
                    return (
                      <li
                        key={p}
                        className={`cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                          used ? "opacity-50 line-through" : ""
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!forceEditable && used) {
                            setScorerError("Este jogador já foi usado em outra rodada.");
                            return;
                          }
                          setScorer(p);
                          setScorerError("");
                          setSuggestions([]);
                        }}
                      >
                        {p}
                        {used && <span className="ml-2 text-xs">(já usado)</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            )}

            {showScorerEditor &&
              (scorerDirty || (forceEditable && scorer.trim().length > 0)) && (
              <Button
                className="w-full"
                variant="outline"
                onClick={handleSaveScorer}
                disabled={!canSaveScorer || savingScorer}
              >
                {savingScorer ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : roundScorer ? (
                  "Atualizar artilheiro"
                ) : (
                  "Salvar artilheiro"
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RoundPredictionPanel;
