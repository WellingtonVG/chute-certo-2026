import { useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import type { BolaoMember } from "@/components/AdminPalpiteControl";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  fetchMatchPredictionsPeek,
  type MatchPredictionPeekEntry,
} from "@/lib/match-predictions-peek";

type Match = Tables<"matches">;

type MatchPredictionsPeekProps = {
  bolaoId: string;
  match: Match;
  members: BolaoMember[];
  isBrasileirao?: boolean;
  bonusQuestion?: string | null;
  className?: string;
};

const PeekRow = ({
  entry,
  isBrasileirao,
  bonusQuestion,
  matchFinished,
}: {
  entry: MatchPredictionPeekEntry;
  isBrasileirao?: boolean;
  bonusQuestion?: string | null;
  matchFinished: boolean;
}) => {
  const hasPrediction = entry.homeScore !== null && entry.awayScore !== null;
  const totalPoints =
    matchFinished && hasPrediction
      ? (entry.points ?? 0) + (entry.scorerPoints ?? 0) + (entry.bonusPoints ?? 0)
      : null;

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
      <UserAvatar
        username={entry.username}
        avatarUrl={entry.avatarUrl}
        size="sm"
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{entry.username}</p>
        {hasPrediction ? (
          <p className="text-sm">
            <span className="font-bold tabular-nums">
              {entry.homeScore} × {entry.awayScore}
            </span>
            {!isBrasileirao && entry.scorerName && (
              <span className="ml-1 text-xs text-muted-foreground">
                · {entry.scorerName}
              </span>
            )}
            {isBrasileirao && bonusQuestion && entry.bonusAnswer !== null && (
              <span className="ml-1 text-xs text-muted-foreground">
                · {entry.bonusAnswer ? "Sim" : "Não"}
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Sem palpite</p>
        )}
      </div>
      {totalPoints !== null && (
        <span className="shrink-0 text-sm font-bold text-accent tabular-nums">
          +{totalPoints}
        </span>
      )}
    </li>
  );
};

const MatchPredictionsPeek = ({
  bolaoId,
  match,
  members,
  isBrasileirao = false,
  bonusQuestion,
  className,
}: MatchPredictionsPeekProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<MatchPredictionPeekEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await fetchMatchPredictionsPeek(bolaoId, match.id, members));
    } catch {
      setError("Não foi possível carregar os palpites.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) load();
  };

  const withPrediction = entries.filter((e) => e.homeScore !== null).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground",
            className
          )}
          aria-label="Ver palpites de todos"
          onClick={(e) => e.stopPropagation()}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm gap-3">
        <DialogHeader>
          <DialogTitle className="text-base">Palpites do jogo</DialogTitle>
          <DialogDescription>
            {match.home_team} × {match.away_team}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="py-4 text-center text-sm text-destructive">{error}</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {withPrediction} de {entries.length} participante
              {entries.length !== 1 ? "s" : ""} palpitou
            </p>
            <ul className="max-h-[min(60dvh,24rem)] space-y-2 overflow-y-auto pr-1">
              {entries.map((entry) => (
                <PeekRow
                  key={entry.userId}
                  entry={entry}
                  isBrasileirao={isBrasileirao}
                  bonusQuestion={bonusQuestion}
                  matchFinished={!!match.is_finished}
                />
              ))}
            </ul>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MatchPredictionsPeek;
