import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pickQuestions, type QuizQuestion } from "@/lib/quiz-data";
import type { QuizConfig } from "@/pages/Quiz";
import { Copy, Users, Check, ArrowLeft, Loader2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import type { QuizLevel } from "@/lib/quiz-data";

interface Props {
  config: QuizConfig;
  onStart: (roomId: string, questions: QuizQuestion[]) => void;
  onBack: () => void;
  initialCode?: string;
}

interface Participant {
  user_id: string;
  username: string;
  is_ready: boolean;
}

const QuizMultiplayerLobby = ({ config, onStart, onBack, initialCode }: Props) => {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<"create" | "join">(initialCode ? "join" : "create");
  const [joinCode, setJoinCode] = useState(initialCode || "");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const hasStartedRef = useRef(false);

  // Auto-join when initialCode is provided
  useEffect(() => {
    if (initialCode && !roomId && !loading) {
      joinRoom(initialCode);
    }
  }, [initialCode]);

  const createRoom = async () => {
    if (!user || !profile) return;
    setLoading(true);
    const q = pickQuestions(config.level as QuizLevel | "all", config.count);
    setQuestions(q);

    const { data, error } = await supabase
      .from("quiz_rooms")
      .insert({
        created_by: user.id,
        level: config.level,
        question_count: config.count,
        questions: q as any,
      })
      .select()
      .single();

    if (error || !data) {
      toast.error("Erro ao criar sala");
      setLoading(false);
      return;
    }

    setRoomId(data.id);
    setRoomCode(data.code);
    setIsCreator(true);

    await supabase.from("quiz_participants").insert({
      room_id: data.id,
      user_id: user.id,
      username: profile.username,
    });

    setLoading(false);
  };

  const joinRoom = async (codeOverride?: string) => {
    const codeToUse = codeOverride || joinCode.trim();
    if (!user || !profile || !codeToUse) return;
    setLoading(true);

    // Extract code from URL if a full link was pasted
    const extracted = extractCodeFromInput(codeToUse);

    const { data: room } = await supabase
      .from("quiz_rooms")
      .select("*")
      .eq("code", extracted.toLowerCase())
      .eq("status", "waiting")
      .maybeSingle();

    if (!room) {
      toast.error("Sala não encontrada ou já iniciada");
      setLoading(false);
      return;
    }

    setRoomId(room.id);
    setRoomCode(room.code);
    setQuestions(room.questions as any as QuizQuestion[]);
    setIsCreator(room.created_by === user.id);

    // Check if already a participant
    const { data: existing } = await supabase
      .from("quiz_participants")
      .select("id")
      .eq("room_id", room.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("quiz_participants").insert({
        room_id: room.id,
        user_id: user.id,
        username: profile.username,
      });
    }

    setLoading(false);
  };

  const extractCodeFromInput = (input: string): string => {
    // Match /quiz/sala/CODE pattern in a URL
    const match = input.match(/\/quiz\/sala\/([a-zA-Z0-9]+)/);
    if (match) return match[1];
    return input.trim();
  };

  // Subscribe to participants and room status
  useEffect(() => {
    if (!roomId) return;

    const fetchParticipants = async () => {
      const { data } = await supabase
        .from("quiz_participants")
        .select("user_id, username, is_ready")
        .eq("room_id", roomId);
      if (data) setParticipants(data);
    };

    fetchParticipants();

    const channel = supabase
      .channel(`quiz-room-${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_participants", filter: `room_id=eq.${roomId}` }, () => {
        fetchParticipants();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "quiz_rooms", filter: `id=eq.${roomId}` }, (payload) => {
        if (payload.new && (payload.new as any).status === "playing") {
          if (!hasStartedRef.current) {
            hasStartedRef.current = true;
            onStart(roomId, questions);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, questions, onStart]);

  const toggleReady = async () => {
    if (!user || !roomId) return;
    const newReady = !isReady;
    setIsReady(newReady);
    await supabase
      .from("quiz_participants")
      .update({ is_ready: newReady })
      .eq("room_id", roomId)
      .eq("user_id", user.id);
  };

  const startGame = async () => {
    if (!roomId) return;
    // Only update DB — the realtime trigger will call onStart for everyone (including creator)
    await supabase
      .from("quiz_rooms")
      .update({ status: "playing" })
      .eq("id", roomId);
  };

  const allReady = participants.length >= 2 && participants.every((p) => p.is_ready);

  const getInviteLink = () => {
    return `${window.location.origin}/quiz/sala/${roomCode}`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(getInviteLink());
    toast.success("Link copiado!");
  };

  // Not yet in a room
  if (!roomId) {
    return (
      <div className="space-y-5">
        {!initialCode && (
          <div className="flex gap-2">
            <Button variant={mode === "create" ? "default" : "outline"} className="flex-1" onClick={() => setMode("create")}>
              Criar Sala
            </Button>
            <Button variant={mode === "join" ? "default" : "outline"} className="flex-1" onClick={() => setMode("join")}>
              Entrar em Sala
            </Button>
          </div>
        )}

        {mode === "create" && !initialCode && (
          <Button className="w-full" size="lg" onClick={createRoom} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Sala
          </Button>
        )}

        {mode === "join" && !initialCode && (
          <div className="space-y-3">
            <Input
              placeholder="Cole o link ou código da sala"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <Button className="w-full" size="lg" onClick={() => joinRoom()} disabled={loading || !joinCode.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </div>
        )}

        {initialCode && (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Entrando na sala...</span>
          </div>
        )}

        <Button variant="ghost" className="w-full" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  // In lobby
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-4">
          <p className="mb-2 text-xs text-muted-foreground">Link de convite</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 truncate rounded-md bg-secondary/50 px-3 py-2 text-sm font-mono text-foreground">
              {getInviteLink()}
            </div>
            <Button variant="ghost" size="icon" onClick={copyLink}>
              <LinkIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold">Jogadores ({participants.length})</h3>
          </div>
          <div className="space-y-2">
            {participants.map((p) => (
              <div key={p.user_id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                <span className="text-sm font-medium">{p.username}</span>
                {p.is_ready ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                    <Check className="h-3 w-3" /> Pronto
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Aguardando...</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          variant={isReady ? "secondary" : "outline"}
          className="flex-1"
          onClick={toggleReady}
        >
          {isReady ? "✅ Pronto" : "Estou Pronto"}
        </Button>
        {isCreator && (
          <Button className="flex-1" disabled={!allReady} onClick={startGame}>
            Iniciar Quiz
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizMultiplayerLobby;
