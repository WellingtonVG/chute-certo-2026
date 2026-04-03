import { Trophy, Clock, RotateCcw, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { QuizResultData } from "@/pages/Quiz";
import { toast } from "sonner";

interface Props {
  result: QuizResultData;
  onPlayAgain: () => void;
  rankings?: { username: string; score: number; total: number; timeTaken: number }[];
}

const LEVEL_LABEL: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
  all: "Todos",
};

const QuizResult = ({ result, onPlayAgain, rankings }: Props) => {
  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  const minutes = Math.floor(result.timeTaken / 60);
  const seconds = result.timeTaken % 60;
  const timeStr = minutes > 0 ? `${minutes}min ${seconds}s` : `${seconds}s`;

  const getMessage = () => {
    if (pct === 100) return "Perfeito! 🏆";
    if (pct >= 80) return "Excelente! 🌟";
    if (pct >= 60) return "Muito bom! 👏";
    if (pct >= 40) return "Nada mal! 🤔";
    return "Tente novamente! 💪";
  };

  const handleShare = () => {
    const levelLabel = (result as any).level ? LEVEL_LABEL[(result as any).level] || "Todos" : "Todos";
    const text =
      `🧠 Quiz Copa do Mundo\n` +
      `Nível: ${levelLabel} | ${result.total} perguntas\n` +
      `Resultado: ${result.score}/${result.total} (${pct}%) em ${timeStr}\n\n` +
      `Tenta aí: ${window.location.origin}/quiz`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    toast.success("Abrindo WhatsApp...");
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
            <p className="text-2xl font-bold text-foreground">{timeStr}</p>
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

      <div className="grid gap-2">
        <Button className="w-full tap-highlight-none" size="lg" onClick={handleShare} variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Compartilhar Resultado
        </Button>
        <Button className="w-full tap-highlight-none" size="lg" onClick={onPlayAgain}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Jogar Novamente
        </Button>
      </div>
    </div>
  );
};

export default QuizResult;
