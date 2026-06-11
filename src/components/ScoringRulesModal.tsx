import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { SEASON_PREDICTION_POINTS } from "@/lib/season-predictions";
import { getSeasonPredictionsDeadlineLabel } from "@/lib/prediction-deadlines";

const ScoringRulesModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <Info className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📋 Regras de Pontuação
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="mb-2 font-semibold text-primary">⚽ Palpites por Jogo</h3>
            <ul className="space-y-1.5 text-muted-foreground">
              <li className="flex justify-between">
                <span>Placar exato</span>
                <span className="font-bold text-foreground">5 pts</span>
              </li>
              <li className="flex justify-between">
                <span>Resultado + diferença de gols</span>
                <span className="font-bold text-foreground">3 pts</span>
              </li>
              <li className="flex justify-between">
                <span>Apenas o resultado certo</span>
                <span className="font-bold text-foreground">1 pt</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-primary">🤝 Empates</h3>
            <ul className="space-y-1.5 text-muted-foreground">
              <li className="flex justify-between">
                <span>Placar exato de empate</span>
                <span className="font-bold text-foreground">5 pts</span>
              </li>
              <li className="flex justify-between">
                <span>Outro placar de empate</span>
                <span className="font-bold text-foreground">2 pts</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-primary">🎯 Goleador do Jogo</h3>
            <ul className="space-y-1.5 text-muted-foreground">
              <li className="flex justify-between">
                <span>Acertou o goleador</span>
                <span className="font-bold text-green-600">+2 pts</span>
              </li>
              <li className="flex justify-between">
                <span>Errou o goleador</span>
                <span className="font-bold text-red-500">−1 pt</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-primary">🔥 Multiplicador Eliminatórias</h3>
            <p className="text-muted-foreground">
              Todos os jogos a partir das oitavas de final têm multiplicador de{" "}
              <span className="font-bold text-foreground">1.5×</span> sobre a pontuação total.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-primary">⭐ Palpites Especiais</h3>
            <ul className="space-y-1.5 text-muted-foreground">
              <li className="flex justify-between">
                <span>Campeão da Copa</span>
                <span className="font-bold text-foreground">{SEASON_PREDICTION_POINTS} pts</span>
              </li>
              <li className="flex justify-between">
                <span>Melhor Jogador da Copa</span>
                <span className="font-bold text-foreground">{SEASON_PREDICTION_POINTS} pts</span>
              </li>
              <li className="flex justify-between">
                <span>Artilheiro da Copa</span>
                <span className="font-bold text-foreground">{SEASON_PREDICTION_POINTS} pts</span>
              </li>
              <li className="flex justify-between">
                <span>Jogador Revelação</span>
                <span className="font-bold text-foreground">{SEASON_PREDICTION_POINTS} pts</span>
              </li>
              <li className="text-xs italic">
                Prazo até {getSeasonPredictionsDeadlineLabel()}
              </li>
              <li className="text-xs italic">
                Palpites por jogo: até o início de cada partida
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScoringRulesModal;
