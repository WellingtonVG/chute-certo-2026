import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import type { Tables } from "@/integrations/supabase/types";

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

const Calendario = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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

  const handleShare = async () => {
    if (!contentRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Erro ao gerar imagem");
          setSharing(false);
          return;
        }
        const file = new File([blob], "calendario-copa-2026.png", { type: "image/png" });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: "Calendário Copa do Mundo 2026",
            files: [file],
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "calendario-copa-2026.png";
          a.click();
          URL.revokeObjectURL(url);
          toast.success("Imagem baixada com sucesso!");
        }
        setSharing(false);
      }, "image/png");
    } catch {
      toast.error("Erro ao compartilhar");
      setSharing(false);
    }
  };

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
          <h1 className="text-xl font-bold">Calendário</h1>
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
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{match.home_team}</span>
                              {match.is_finished ? (
                                <span className="mx-2 text-lg font-bold text-accent">
                                  {match.home_score} × {match.away_score}
                                </span>
                              ) : (
                                <span className="mx-2 text-sm font-medium text-muted-foreground">
                                  {time}
                                </span>
                              )}
                              <span className="font-semibold">{match.away_team}</span>
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
          </div>
        )}
      </main>
    </div>
  );
};

export default Calendario;
