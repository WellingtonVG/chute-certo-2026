import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Calendar, HelpCircle, Shield, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    key: "bolao",
    label: "Bolão",
    description: "Seus palpites e rankings",
    icon: Trophy,
    path: "/bolao",
    disabled: false,
  },
  {
    key: "calendario",
    label: "Calendário",
    description: "Tabela de jogos",
    icon: Calendar,
    path: "/calendario",
    disabled: false,
  },
  {
    key: "quiz",
    label: "Quiz",
    description: "Teste seus conhecimentos",
    icon: HelpCircle,
    path: "/quiz",
    disabled: false,
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { profile, isAdmin, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-primary px-4 py-6 text-primary-foreground">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Copa 2026</h1>
            <p className="text-sm opacity-80">
              Olá, <span className="font-semibold">{profile?.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/configuracoes")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Menu Grid */}
      <main className="mx-auto w-full max-w-lg flex-1 p-4">
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => !item.disabled && navigate(item.path)}
              disabled={item.disabled}
              className="group relative flex flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6 text-card-foreground shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {item.disabled && (
                <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                  Em breve
                </span>
              )}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <item.icon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </button>
          ))}

          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-accent bg-accent/10 p-6 text-card-foreground shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <Shield className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Admin</p>
                <p className="text-xs text-muted-foreground">Gerenciar</p>
              </div>
            </button>
          )}
        </div>
      </main>

      <footer className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
        Bolão Copa do Mundo 2026 ⚽
      </footer>
    </div>
  );
};

export default Index;
