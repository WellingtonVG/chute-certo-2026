import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Cog, LogOut, Settings, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BolaoFeed from "@/components/BolaoFeed";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [bolaoId, setBolaoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCopaBolao = async () => {
      if (!user) return;
      const { data: memberships } = await supabase
        .from("bolao_members")
        .select("bolao_id")
        .eq("user_id", user.id);
      const ids = (memberships || []).map((m) => m.bolao_id);
      if (ids.length === 0) {
        setLoading(false);
        return;
      }
      const { data: bs } = await supabase
        .from("boloes")
        .select("id, created_at")
        .in("id", ids)
        .eq("competition", "copa_do_mundo_2026")
        .order("created_at", { ascending: true })
        .limit(1);
      setBolaoId(bs?.[0]?.id ?? null);
      setLoading(false);
    };
    fetchCopaBolao();
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="border-b bg-primary px-4 py-5 text-primary-foreground">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Copa 2026</h1>
            <p className="text-xs opacity-80">
              Olá, <span className="font-semibold">{profile?.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/configuracoes")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
              aria-label="Configurações"
            >
              <Settings className="h-5 w-5" />
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
                className="text-primary-foreground hover:bg-primary-foreground/10"
                aria-label="Admin"
              >
                <Cog className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-primary-foreground hover:bg-primary-foreground/10"
              aria-label="Sair"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !bolaoId ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-base font-medium">Você ainda não está em nenhum bolão da Copa</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Peça um link de convite para participar.
            </p>
            <Button className="mt-4" onClick={() => navigate("/bolao")}>
              Ver meus bolões
            </Button>
          </div>
        ) : (
          <>
            <button
              onClick={() => navigate(`/bolao/${bolaoId}?tab=ranking`)}
              className="mb-4 flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent/10"
            >
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-accent" />
                <span className="text-base font-semibold">Ver Ranking</span>
              </div>
              <span className="text-xl">🏆</span>
            </button>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Feed do bolão
            </h2>
            <BolaoFeed bolaoId={bolaoId} />
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
