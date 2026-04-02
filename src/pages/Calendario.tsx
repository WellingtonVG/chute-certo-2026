import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Copy, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { getFlag } from "@/lib/country-flags";

type Match = Tables<"matches">;

const stageLabels: Record<string, string> = {
  group: "Fase de Grupos",
  round_of_32: "32 avos",
  round_of_16: "Oitavas de Final",
  quarter_final: "Quartas de Final",
  semi_final: "Semifinal",
  third_place: "Disputa de 3º Lugar",
  final: "Final",
};

const stageEmoji: Record<string, string> = {
  group: "🏟️",
  round_of_32: "⚔️",
  round_of_16: "⚔️",
  quarter_final: "🔥",
  semi_final: "🔥",
  third_place: "🥉",
  final: "🏆",
};

const Calendario = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("matches")
        .select("*")
        .order("match_date", { ascending: true });
      setMatches(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  // Group by date
  const grouped: Record<string, Match[]> = {};
  matches.forEach((m) => {
    const dateKey = new Date(m.match_date).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(m);
  });

  const buildShareText = () => {
    let text = "⚽ *Copa do Mundo 2026 — Calendário*\n\n";

    Object.entries(grouped).forEach(([date, dayMatches]) => {
      text += `📅 *${date}*\n`;
      dayMatches.forEach((match) => {
        const time = new Date(match.match_date).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        });
        const emoji = stageEmoji[match.stage] || "⚽";
        const score = match.is_finished
          ? `  ${match.home_score} × ${match.away_score}`
          : "";
        const venue = [match.stadium, match.city].filter(Boolean).join(", ");
        const stage = stageLabels[match.stage] || match.stage;
        const group = match.group_name ? ` • ${match.group_name}` : "";

        text += `${emoji} ${time} — ${match.home_team} × ${match.away_team}${score}\n`;
        if (venue) text += `   📍 ${venue}\n`;
        text += `   ${stage}${group}\n`;
      });
      text += "\n";
    });

    text += "─────────────────────\n";
    text += "📋 Fonte: FIFA / dados oficiais\n";
    text += "🕐 Horários em BRT (Brasília)";
    return text;
  };

  const handleCopyText = async () => {
    const text = buildShareText();
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado! Cole no WhatsApp 📲");
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-primary px-4 py-4 text-primary-foreground">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">Calendário</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyText}
            disabled={loading || matches.length === 0}
            className="text-primary-foreground hover:bg-primary-foreground/10 gap-1.5"
          >
            <Copy className="h-4 w-4" />
            Compartilhar
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : matches.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            Nenhum jogo cadastrado ainda
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, dayMatches]) => (
              <div key={date}>
                <h2 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">
                  {date}
                </h2>
                <div className="space-y-2">
                  {dayMatches.map((match) => {
                    const time = new Date(match.match_date).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Sao_Paulo",
                    });
                    return (
                      <Card key={match.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="flex-1 font-semibold">{getFlag(match.home_team)} {match.home_team}</span>
                              {match.is_finished ? (
                                <span className="mx-3 min-w-[60px] text-center text-lg font-bold text-accent">
                                  {match.home_score} × {match.away_score}
                                </span>
                              ) : (
                                <span className="mx-3 min-w-[60px] text-center text-sm font-medium text-muted-foreground">
                                  {time}
                                </span>
                              )}
                              <span className="flex-1 text-right font-semibold">{match.away_team} {getFlag(match.away_team)}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {match.stadium && <span>{match.stadium}</span>}
                              {match.city && <span>• {match.city}</span>}
                              <span className="ml-auto">
                                {stageLabels[match.stage]}
                                {match.group_name && ` • ${match.group_name}`}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="text-center text-[10px] text-muted-foreground/60 pt-2">
              Fonte: FIFA / dados oficiais · Horários em BRT (Brasília)
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Calendario;
