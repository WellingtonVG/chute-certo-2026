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

interface ScoringRulesModalProps {
  firstMatchDate?: string | null;
}

const ScoringRulesModal = ({ firstMatchDate }: ScoringRulesModalProps) => {
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
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📋 Regras de Pontuação
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="mb-2 font-semibold text-primary">⚽ Palpites por Jogo</h3>
            <p className="mb-2 text-xs text-muted-foreground">
              Até o apito inicial. Sem palpite = 0 pts. Placar considera prorrogação; pênaltis na
              disputa não contam.
            </p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li className="flex justify-between">
                <span>Placar exato</span>
                <span className="font-bold text-foreground">10 pts</span>
              </li>
              <li className="flex justify-between">
                <span>Resultado + gols de um time</span>
                <span className="font-bold text-foreground">7 pts</span>
              </li>
              <li className="flex justify-between">
                <span>Só o resultado</span>
                <span className="font-bold text-foreground">5 pts</span>
              </li>
              <li className="flex justify-between">
                <span>Só gols de um time</span>
                <span className="font-bold text-foreground">2 pts</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-primary">🔥 Multiplicador Eliminatórias</h3>
            <p className="text-muted-foreground">
              A partir das <span className="font-bold text-foreground">oitavas de final</span>, os
              pontos por jogo são{" "}
              <span className="font-bold text-foreground">dobrados (×2)</span>. A rodada de 32 (R32)
              vale pontos-base, sem dobrar.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-primary">🎯 Jogador da Rodada</h3>
            <p className="mb-2 text-xs text-muted-foreground">
              Escolha 1 jogador por rodada. Se ele marcar pelo menos um gol naquela rodada, você
              pontua. Não vale gol contra nem gol em disputa de pênaltis. O jogador não pode ser
              repetido entre rodadas.
            </p>
            <p className="mb-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Fase de grupos:</span> cada dia de jogos
              é uma rodada. <span className="font-medium text-foreground">Eliminatórias:</span> R32,
              oitavas, quartas, semi, 3º lugar e final — uma rodada por fase.
            </p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li className="flex justify-between">
                <span>Fase de grupos e R32</span>
                <span className="font-bold text-green-600">+20 pts</span>
              </li>
              <li className="flex justify-between">
                <span>Oitavas em diante</span>
                <span className="font-bold text-green-600">+40 pts</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-primary">⭐ Palpites Especiais</h3>
            <ul className="space-y-1.5 text-muted-foreground">
              <li className="flex justify-between">
                <span>Campeão da Copa</span>
                <span className="font-bold text-foreground">{SEASON_PREDICTION_POINTS} pts</span>
              </li>
              <li className="flex justify-between">
                <span>Melhor Jogador (Bola de Ouro)</span>
                <span className="font-bold text-foreground">{SEASON_PREDICTION_POINTS} pts</span>
              </li>
              <li className="flex justify-between">
                <span>Artilheiro da Copa</span>
                <span className="font-bold text-foreground">{SEASON_PREDICTION_POINTS} pts</span>
              </li>
              <li className="flex justify-between">
                <span>Jogador Revelação (nascido ≥ 2005)</span>
                <span className="font-bold text-foreground">{SEASON_PREDICTION_POINTS} pts</span>
              </li>
              <li className="text-xs italic">
                Prazo até o 1º jogo da Copa ({getSeasonPredictionsDeadlineLabel(firstMatchDate)})
              </li>
              <li className="text-xs italic">
                Palpites por jogo: até o início de cada partida
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-primary">🏆 Classificação</h3>
            <p className="text-muted-foreground">
              Empate na pontuação total: participantes dividem a mesma posição e a premiação
              correspondente — sem critério de desempate.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScoringRulesModal;
