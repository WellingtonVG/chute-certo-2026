import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Trophy, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import type { Tables } from "@/integrations/supabase/types";

type Bolao = Tables<"boloes">;

const BolaoList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [boloes, setBoloes] = useState<Bolao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoloes = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("boloes")
        .select("*")
        .order("created_at", { ascending: false });
      setBoloes(data || []);
      setLoading(false);
    };
    fetchBoloes();
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
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
          <h1 className="text-xl font-bold">Meus Bolões</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : boloes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium">Nenhum bolão ainda</p>
            <p className="text-sm text-muted-foreground">
              Peça um link de convite para participar de um bolão!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {boloes.map((bolao) => (
              <Card
                key={bolao.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/bolao/${bolao.id}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{bolao.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">Copa do Mundo 2026</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Ver palpites e ranking</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default BolaoList;
