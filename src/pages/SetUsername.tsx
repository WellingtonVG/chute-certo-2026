import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Check, X, Loader2 } from "lucide-react";
import { useEffect } from "react";

const SetUsername = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!username.trim()) {
      setIsAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setChecking(true);
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.trim())
        .maybeSingle();
      setIsAvailable(!data);
      setChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAvailable) return;

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim() })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      const from = (location.state as any)?.from;
      const savedRedirect = localStorage.getItem("invite_redirect");
      if (savedRedirect) {
        localStorage.removeItem("invite_redirect");
        navigate(savedRedirect, { replace: true });
      } else {
        navigate(from || "/", { replace: true });
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Trophy className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Escolha seu username</CardTitle>
          <CardDescription>
            Este será seu nome público no bolão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuário</Label>
              <div className="relative">
                <Input
                  id="username"
                  placeholder="seu_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  required
                  minLength={3}
                  maxLength={20}
                />
                {username.trim() && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checking ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : isAvailable ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              {username.trim() && !checking && isAvailable === false && (
                <p className="text-sm text-destructive">Nome já está em uso</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !isAvailable || !username.trim()}
            >
              {loading ? "Salvando..." : "Confirmar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetUsername;
