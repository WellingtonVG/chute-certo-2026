import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuizMenu from "@/components/quiz/QuizMenu";
import QuizGame from "@/components/quiz/QuizGame";
import QuizResult from "@/components/quiz/QuizResult";
import QuizMultiplayerLobby from "@/components/quiz/QuizMultiplayerLobby";
import QuizMultiplayerGame from "@/components/quiz/QuizMultiplayerGame";
import type { QuizQuestion, QuizLevel } from "@/lib/quiz-data";

export type QuizMode = "solo" | "timed" | "multiplayer";

export interface QuizConfig {
  mode: QuizMode;
  level: QuizLevel | "all";
  count: number;
}

export interface QuizResultData {
  score: number;
  total: number;
  timeTaken: number;
  mode: QuizMode;
}

type Screen = "menu" | "game" | "result" | "mp-lobby" | "mp-game";

const Quiz = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("menu");
  const [config, setConfig] = useState<QuizConfig>({ mode: "solo", level: "easy", count: 12 });
  const [result, setResult] = useState<QuizResultData | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [mpQuestions, setMpQuestions] = useState<QuizQuestion[]>([]);

  const handleStart = (cfg: QuizConfig) => {
    setConfig(cfg);
    if (cfg.mode === "multiplayer") {
      setScreen("mp-lobby");
    } else {
      setScreen("game");
    }
  };

  const handleFinish = (res: QuizResultData) => {
    setResult(res);
    setScreen("result");
  };

  const handleMpStart = (rId: string, questions: QuizQuestion[]) => {
    setRoomId(rId);
    setMpQuestions(questions);
    setScreen("mp-game");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-primary px-4 py-4 text-primary-foreground">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (screen === "menu" ? navigate("/") : setScreen("menu"))}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Quiz Copa do Mundo</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 p-4">
        {screen === "menu" && <QuizMenu onStart={handleStart} />}
        {screen === "game" && (
          <QuizGame config={config} onFinish={handleFinish} />
        )}
        {screen === "result" && result && (
          <QuizResult result={result} onPlayAgain={() => setScreen("menu")} />
        )}
        {screen === "mp-lobby" && (
          <QuizMultiplayerLobby config={config} onStart={handleMpStart} onBack={() => setScreen("menu")} />
        )}
        {screen === "mp-game" && roomId && (
          <QuizMultiplayerGame
            roomId={roomId}
            questions={mpQuestions}
            onFinish={handleFinish}
          />
        )}
      </main>
    </div>
  );
};

export default Quiz;
