import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import QuizMenu from "@/components/quiz/QuizMenu";
import QuizGame from "@/components/quiz/QuizGame";
import QuizResult from "@/components/quiz/QuizResult";
import QuizMultiplayerLobby from "@/components/quiz/QuizMultiplayerLobby";
import QuizMultiplayerGame from "@/components/quiz/QuizMultiplayerGame";
import BottomNav from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
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
  const [config, setConfig] = useState<QuizConfig>({ mode: "multiplayer", level: "all", count: 12 });
  const [result, setResult] = useState<QuizResultData | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [mpQuestions, setMpQuestions] = useState<QuizQuestion[]>([]);
  const mpStartedRef = useRef(false);

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

  const handleMpStart = useCallback((rId: string, questions: QuizQuestion[]) => {
    if (mpStartedRef.current) return;
    mpStartedRef.current = true;
    setRoomId(rId);
    setMpQuestions(questions);
    setScreen("mp-game");
  }, []);

  const handleBackToMenu = () => {
    mpStartedRef.current = false;
    setScreen("menu");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <PageHeader
        title="Quiz Copa do Mundo"
        onBack={() => (screen === "menu" ? navigate("/") : handleBackToMenu())}
      />

      <main className="mx-auto w-full max-w-lg flex-1 p-4">
        {screen === "menu" && <QuizMenu onStart={handleStart} />}
        {screen === "game" && (
          <QuizGame config={config} onFinish={handleFinish} />
        )}
        {screen === "result" && result && (
          <QuizResult result={result} onPlayAgain={handleBackToMenu} />
        )}
        {screen === "mp-lobby" && (
          <QuizMultiplayerLobby
            config={config}
            onStart={handleMpStart}
            onBack={handleBackToMenu}
          />
        )}
        {screen === "mp-game" && roomId && (
          <QuizMultiplayerGame
            roomId={roomId}
            questions={mpQuestions}
            onFinish={handleFinish}
          />
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Quiz;
