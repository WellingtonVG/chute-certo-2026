import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Cog, LogOut, Settings, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import BolaoFeed from "@/components/BolaoFeed";
import BottomNav from "@/components/BottomNav";
import { MobilePage } from "@/components/MobilePage";
import { UserAvatar } from "@/components/UserAvatar";
import { PageHeader } from "@/components/PageHeader";
import { DEFAULT_BOLAO_ID, DEFAULT_BOLAO_PATH } from "@/lib/bolao-config";

const Index = () => {
  const navigate = useNavigate();
  const { profile, isAdmin, signOut } = useAuth();

  return (
    <MobilePage withBottomNav>
      <PageHeader
        leading={
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar
              username={profile?.username || "?"}
              avatarUrl={profile?.avatar_url}
              size="sm"
              className="shrink-0 border border-primary-foreground/20"
            />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight">Copa 2026</h1>
              <p className="truncate text-xs opacity-80">
                Olá, <span className="font-semibold">{profile?.username}</span>
              </p>
            </div>
          </div>
        }
        actions={
          <>
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
          </>
        }
        className="py-5"
      />

      <main className="mx-auto w-full max-w-lg flex-1 p-4">
        <button
          onClick={() => navigate(`${DEFAULT_BOLAO_PATH}?tab=ranking`)}
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
        <BolaoFeed bolaoId={DEFAULT_BOLAO_ID} />
      </main>

      <BottomNav />
    </MobilePage>
  );
};

export default Index;
