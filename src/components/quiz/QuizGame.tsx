import { useState, useEffect, useRef, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { pickQuestions, checkAnswer, type QuizQuestion } from "@/lib/quiz-data";
import type { QuizConfig, QuizResultData } from "@/pages/Quiz";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Check, X, Clock } from "lucide-react";

interface Props {
  config: QuizConfig;
  onFinish: (result: QuizResultData) => void;
  questions?: QuizQuestion[]; // For multiplayer
}

const LEVEL_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

const LEVEL_LABELS: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

const QuizGame = ({ config, onFinish, questions: externalQuestions }: Props) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const isTimed = config.mode === "timed";

  useEffect(() => {
    if (externalQuestions) {
      setQuestions(externalQuestions);
    } else {
      const q = pickQuestions(config.level, isTimed ? 200 : config.count);
      setQuestions(q);
    }
  }, []);

  useEffect(() => {
    if (isTimed) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setGameOver(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [isTimed]);

  const finishGame = useCallback(
    async (finalScore: number, total: number) => {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      // Save last result
      if (user) {
        const { data: existing } = await supabase
          .from("quiz_results")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (existing) {
          await supabase
            .from("quiz_results")
            .update({ mode: config.mode, level: config.level === "all" ? null : config.level, score: finalScore, total, time_taken: timeTaken, played_at: new Date().toISOString() })
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("quiz_results")
            .insert({ user_id: user.id, mode: config.mode, level: config.level === "all" ? null : config.level, score: finalScore, total, time_taken: timeTaken });
        }
      }
      onFinish({ score: finalScore, total, timeTaken, mode: config.mode });
    },
    [user, config, startTime, onFinish]
  );

  useEffect(() => {
    if (gameOver) {
      const total = isTimed ? current : questions.length;
      finishGame(score, total);
    }
  }, [gameOver]);

  if (questions.length === 0) return null;

  const q = questions[current];
  if (!q && !gameOver) {
    // Ran out of questions
    finishGame(score, current);
    return null;
  }

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    const correct = checkAnswer(q, option);
    if (correct) setScore((s) => s + 1);

    setTimeout(() => {
      const next = current + 1;
      if (!isTimed && next >= questions.length) {
        finishGame(score + (correct ? 1 : 0), questions.length);
      } else {
        setCurrent(next);
        setSelected(null);
        setShowResult(false);
      }
    }, 1200);
  };

  const isCorrect = selected ? checkAnswer(q, selected) : false;
  const progressValue = isTimed ? (timeLeft / 60) * 100 : ((current + 1) / questions.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        {isTimed ? (
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="h-4 w-4" />
            <span>{timeLeft}s</span>
          </div>
        ) : (
          <span className="text-sm font-medium text-muted-foreground">
            {current + 1}/{questions.length}
          </span>
        )}
        <Progress value={progressValue} className="flex-1" />
        <span className="text-sm font-bold text-accent">{score} pts</span>
      </div>

      {/* Question */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${LEVEL_COLORS[q.level]}`}>
              {LEVEL_LABELS[q.level]}
            </span>
          </div>
          <p className="text-base font-semibold text-foreground leading-snug">{q.question}</p>
        </CardContent>
      </Card>

      {/* Options */}
      <div className="grid gap-2">
        {q.options.map((option, i) => {
          let variant: "outline" | "default" | "destructive" = "outline";
          let icon = null;
          if (showResult) {
            if (option === q.correctAnswer || (q as any)._altAnswers?.includes(option)) {
              variant = "default";
              icon = <Check className="h-4 w-4" />;
            } else if (option === selected && !isCorrect) {
              variant = "destructive";
              icon = <X className="h-4 w-4" />;
            }
          }

          return (
            <Button
              key={i}
              variant={variant}
              className="h-auto justify-start whitespace-normal px-4 py-3 text-left text-sm"
              onClick={() => handleSelect(option)}
              disabled={showResult}
            >
              <span className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{option}</span>
              {icon}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizGame;
