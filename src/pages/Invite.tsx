import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Invite = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [bolaoName, setBolaoName] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchBolao = async () => {
      if (!code) return;
      // Use a public-friendly approach: try fetching by invite_code
      // Note: user needs to be authenticated to see boloes
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("boloes")
        .select("id, name")
        .eq("invite_code", code)
        .maybeSingle();

      if (!data) {
        setNotFound(true);
      } else {
        setBolaoName(data.name);
      }
      setLoading(false);
    };
    if (!authLoading) fetchBolao();
  }, [code, user, authLoading]);

  const handleJoin = async () => {
    if (!user || !code) return;
    setJoining(true);

    const { data: bolao } = await supabase
      .from("boloes")
      .select("id")
      .eq("invite_code", code)
      .single();

    if (!bolao) {
      toast({ title: "Erro", description: "Bolão não encontrado", variant: "destructive" });
      setJoining(false);
      return;
    }

    const { error } = await supabase.from("bolao_members").insert({
      bolao_id: bolao.id,
      user_id: user.id,
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Você já participa deste bolão!" });
        navigate(`/bolao/${bolao.id}`);
      } else {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Você entrou no bolão!" });
      navigate(`/bolao/${bolao.id}`);
    }
    setJoining(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
              <Trophy className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle>Convite para Bolão</CardTitle>
            <CardDescription>
              Faça login ou crie uma conta para participar
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
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Convite inválido</CardTitle>
            <CardDescription>Este link de convite não é válido ou expirou.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>Voltar ao início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Trophy className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle>Entrar no Bolão</CardTitle>
          <CardDescription>
            Você foi convidado para <span className="font-semibold">{bolaoName}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={handleJoin} disabled={joining}>
            {joining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Participar
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
            Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invite;
