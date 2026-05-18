import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Flame, TrendingUp, Medal, ArrowUpRight, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type FeedEvent = {
  id: string;
  bolao_id: string;
  match_id: string | null;
  user_id: string | null;
  event_type: string;
  message: string;
  created_at: string;
};

const iconFor = (type: string) => {
  switch (type) {
    case "exact_score":
      return <Trophy className="h-4 w-4 text-accent" />;
    case "streak":
      return <Flame className="h-4 w-4 text-orange-500" />;
    case "climbed":
      return <TrendingUp className="h-4 w-4 text-primary" />;
    case "podium":
      return <Medal className="h-4 w-4 text-accent" />;
    case "overtook":
      return <ArrowUpRight className="h-4 w-4 text-primary" />;
    default:
      return <Sparkles className="h-4 w-4 text-muted-foreground" />;
  }
};

const BolaoFeed = ({ bolaoId }: { bolaoId: string }) => {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bolaoId) return;

    const fetchEvents = async () => {
      const { data } = await supabase
        .from("feed_events" as any)
        .select("*")
        .eq("bolao_id", bolaoId)
        .order("created_at", { ascending: false })
        .limit(20);
      setEvents((data as unknown as FeedEvent[]) || []);
      setLoading(false);
    };
    fetchEvents();

    const channel = supabase
      .channel(`feed-${bolaoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feed_events", filter: `bolao_id=eq.${bolaoId}` },
        (payload) => {
          setEvents((prev) => [payload.new as FeedEvent, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bolaoId]);

  if (loading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Carregando feed...</p>;
  }

  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sem eventos por enquanto. Os destaques do bolão aparecerão aqui.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((ev) => (
        <Card key={ev.id}>
          <CardContent className="flex items-start gap-3 p-3">
            <div className="mt-0.5">{iconFor(ev.event_type)}</div>
            <div className="flex-1">
              <p className="text-sm leading-snug">{ev.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(ev.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BolaoFeed;
