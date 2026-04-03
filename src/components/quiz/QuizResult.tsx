import { Trophy, Clock, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { QuizResultData } from "@/pages/Quiz";

interface Props {
  result: QuizResultData;
  onPlayAgain: () => void;
  rankings?: { username: string; score: number; total: number; timeTaken: number }[];
}

const QuizResult = ({ result, onPlayAgain, rankings }: Props) => {
  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  const minutes = Math.floor(result.timeTaken / 60);
  const seconds = result.timeTaken % 60;

  const getMessage = () => {
    if (pct === 100) return "Perfeito! 🏆";
    if (pct >= 80) return "Excelente! 🌟";
    if (pct >= 60) return "Muito bom! 👏";
    if (pct >= 40) return "Nada mal! 🤔";
    return "Tente novamente! 💪";
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-4xl font-bold">{getMessage()}</p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-around p-6">
          <div className="text-center">
            <Trophy className="mx-auto mb-1 h-6 w-6 text-accent" />
            <p className="text-2xl font-bold text-foreground">{result.score}/{result.total}</p>
            <p className="text-xs text-muted-foreground">Acertos</p>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{pct}%</p>
            <p className="text-xs text-muted-foreground">Aproveitamento</p>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="text-center">
            <Clock className="mx-auto mb-1 h-6 w-6 text-muted-foreground" />
            <p className="text-2xl font-bold text-foreground">
              {minutes > 0 ? `${minutes}m ` : ""}{seconds}s
            </p>
            <p className="text-xs text-muted-foreground">Tempo</p>
          </div>
        </CardContent>
      </Card>

      {rankings && rankings.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-bold text-foreground">🏆 Ranking da Sessão</h3>
            <div className="space-y-2">
              {rankings.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-accent">{i + 1}.</span>
                    <span className="text-sm font-medium">{r.username}</span>
                  </div>
                  <span className="text-sm font-bold">{r.score}/{r.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button className="w-full" size="lg" onClick={onPlayAgain}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Jogar Novamente
      </Button>
    </div>
  );
};

export default QuizResult;
