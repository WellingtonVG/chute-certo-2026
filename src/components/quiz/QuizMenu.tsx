import { useState } from "react";
import { Trophy, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { QuizConfig, QuizMode } from "@/pages/Quiz";
import type { QuizLevel } from "@/lib/quiz-data";

interface Props {
  onStart: (config: QuizConfig) => void;
}

const modes: { key: QuizMode; label: string; desc: string; icon: typeof Trophy }[] = [
  { key: "solo", label: "Solo", desc: "Escolha dificuldade e número de perguntas", icon: Trophy },
  { key: "timed", label: "Modo Tempo", desc: "1 minuto, o máximo que conseguir!", icon: Clock },
  { key: "multiplayer", label: "Multiplayer", desc: "Desafie seus amigos", icon: Users },
];

const levels: { key: QuizLevel; label: string }[] = [
  { key: "easy", label: "Fácil" },
  { key: "medium", label: "Médio" },
  { key: "hard", label: "Difícil" },
];

const counts = [6, 12, 20];

const QuizMenu = ({ onStart }: Props) => {
  const [mode, setMode] = useState<QuizMode>("solo");
  const [level, setLevel] = useState<QuizLevel>("easy");
  const [count, setCount] = useState(12);

  const handleStart = () => {
    if (mode === "timed") {
      onStart({ mode: "timed", level: "all", count: 999 });
    } else {
      onStart({ mode, level, count });
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-foreground">Escolha o modo de jogo</h2>

      <div className="grid gap-3">
        {modes.map((m) => (
          <Card
            key={m.key}
            className={`cursor-pointer transition-all ${mode === m.key ? "ring-2 ring-primary border-primary" : "hover:shadow-md"}`}
            onClick={() => setMode(m.key)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${mode === m.key ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(mode === "solo" || mode === "multiplayer") && (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Dificuldade</h3>
            <RadioGroup value={level} onValueChange={(v) => setLevel(v as QuizLevel)} className="flex gap-3">
              {levels.map((l) => (
                <div key={l.key} className="flex items-center gap-2">
                  <RadioGroupItem value={l.key} id={`level-${l.key}`} />
                  <Label htmlFor={`level-${l.key}`} className="cursor-pointer">{l.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Número de perguntas</h3>
            <div className="flex gap-2">
              {counts.map((c) => (
                <Button
                  key={c}
                  variant={count === c ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCount(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      <Button className="w-full" size="lg" onClick={handleStart}>
        {mode === "multiplayer" ? "Criar Sala" : "Começar Quiz"}
      </Button>
    </div>
  );
};

export default QuizMenu;
