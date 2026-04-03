import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import QuizGame from "./QuizGame";
import QuizResult from "./QuizResult";
import type { QuizResultData } from "@/pages/Quiz";
import type { QuizQuestion } from "@/lib/quiz-data";
import { Loader2 } from "lucide-react";

interface Props {
  roomId: string;
  questions: QuizQuestion[];
  onFinish: (result: QuizResultData) => void;
}

interface RankingEntry {
  username: string;
  score: number;
  total: number;
  timeTaken: number;
}

const QuizMultiplayerGame = ({ roomId, questions, onFinish }: Props) => {
  const { user } = useAuth();
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<QuizResultData | null>(null);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [allDone, setAllDone] = useState(false);

  const handleFinish = async (res: QuizResultData) => {
    setResult(res);
    setFinished(true);

    // Update participant record
    if (user) {
      await supabase
        .from("quiz_participants")
        .update({ score: res.score, total: res.total, finished: true, time_taken: res.timeTaken })
        .eq("room_id", roomId)
        .eq("user_id", user.id);
    }
  };

  // Poll for all finished
  useEffect(() => {
    if (!finished) return;

    const fetchRankings = async () => {
      const { data } = await supabase
        .from("quiz_participants")
        .select("username, score, total, finished, time_taken")
        .eq("room_id", roomId)
        .order("score", { ascending: false });

      if (data) {
        const sorted = data.sort((a, b) => b.score - a.score || (a.time_taken ?? 0) - (b.time_taken ?? 0));
        setRankings(sorted.map((r) => ({ username: r.username, score: r.score, total: r.total, timeTaken: r.time_taken ?? 0 })));
        setAllDone(data.every((p) => p.finished));
      }
    };

    fetchRankings();

    const channel = supabase
      .channel(`quiz-results-${roomId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "quiz_participants", filter: `room_id=eq.${roomId}` }, () => {
        fetchRankings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [finished, roomId]);

  if (finished && result) {
    return (
      <div className="space-y-4">
        {!allDone && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-accent/10 p-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Aguardando outros jogadores...
          </div>
        )}
        <QuizResult
          result={result}
          onPlayAgain={() => onFinish(result)}
          rankings={rankings}
        />
      </div>
    );
  }

  return (
    <QuizGame
      config={{ mode: "multiplayer", level: "all", count: questions.length }}
      onFinish={handleFinish}
      questions={questions}
    />
  );
};

export default QuizMultiplayerGame;
