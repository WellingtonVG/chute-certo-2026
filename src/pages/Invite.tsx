import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BolaoLookup {
  id: string;
  name: string;
  invite_created_at: string;
  expired: boolean;
}

const Invite = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [bolaoData, setBolaoData] = useState<BolaoLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [expired, setExpired] = useState(false);

  // Lookup bolão via public RPC (works without auth)
  useEffect(() => {
    const fetchBolao = async () => {
      if (!code) return;

      const { data, error } = await supabase.rpc("lookup_bolao_by_invite", {
        invite_code_input: code,
      });

      if (!data || error) {
        setNotFound(true);
      } else {
        const parsed = data as unknown as BolaoLookup;
        setBolaoData(parsed);
        if (parsed.expired) {
          setExpired(true);
        }
      }
      setLoading(false);
    };
    fetchBolao();
  }, [code]);

  // Auto-join when user is logged in and bolão is valid
  useEffect(() => {
    if (authLoading || !user || !bolaoData || expired || notFound || joining) return;
    handleJoin();
  }, [authLoading, user, bolaoData, expired, notFound]);

  const handleJoin = async () => {
    if (!user || !bolaoData) return;
    setJoining(true);

    const { error } = await supabase.from("bolao_members").insert({
      bolao_id: bolaoData.id,
      user_id: user.id,
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Você já participa deste bolão!" });
        navigate(`/bolao/${bolaoData.id}`, { replace: true });
      } else {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Você entrou no bolão!" });
      navigate(`/bolao/${bolaoData.id}`, { replace: true });
    }
    setJoining(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Convite inválido</CardTitle>
            <CardDescription>Este link de convite não é válido.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>Voltar ao início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Convite expirado</CardTitle>
            <CardDescription>
              Este link de convite para <span className="font-semibold">{bolaoData?.name}</span> expirou.
              Peça ao administrador para gerar um novo link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>Voltar ao início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is logged in — show joining state
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
              <Trophy className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle>Entrando no Bolão</CardTitle>
            <CardDescription>
              {joining
                ? "Entrando..."
                : `Você foi convidado para ${bolaoData?.name}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {joining ? (
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <Button className="w-full" onClick={handleJoin}>
                  Participar
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
                  Voltar
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in — show invite info and login button
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Trophy className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle>Convite para Bolão</CardTitle>
          <CardDescription>
            Você foi convidado para <span className="font-semibold">{bolaoData?.name}</span>.
            Faça login ou crie uma conta para participar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => navigate(`/auth?redirect=/convite/${code}`)}>
            Entrar ou criar conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invite;
