import { useEffect, useState } from "react";
import { AlertTriangle, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ADMIN_PREDICTIONS_SETUP_SQL,
  getSupabaseSqlEditorUrl,
} from "@/lib/admin-setup-sql";

const AdminSetupBanner = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<"checking" | "ready" | "missing">("checking");

  const checkSetup = async () => {
    setStatus("checking");
    const { error } = await supabase.rpc("admin_upsert_predictions", {
      bolao_id_input: "00000000-0000-0000-0000-000000000001",
      target_user_id: "00000000-0000-0000-0000-000000000002",
      predictions_input: [],
    });

    if (!error) {
      setStatus("ready");
      return;
    }

    const msg = error.message.toLowerCase();
    if (msg.includes("could not find") || msg.includes("schema cache")) {
      setStatus("missing");
      return;
    }

    // Função existe (erro esperado: membro não encontrado, unauthorized, etc.)
    setStatus("ready");
  };

  useEffect(() => {
    checkSetup();
  }, []);

  const copySql = async () => {
    await navigator.clipboard.writeText(ADMIN_PREDICTIONS_SETUP_SQL);
    toast({
      title: "SQL copiado!",
      description: "Cole no Supabase SQL Editor e clique em Run.",
    });
  };

  if (status !== "missing") return null;

  return (
    <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 pr-12">
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-destructive">
            Palpite retroativo ainda não está configurado no banco
          </p>
          <p className="text-muted-foreground">
            Execute o SQL abaixo <strong>uma vez</strong> no Supabase para liberar o salvamento:
          </p>
          <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
            <li>Clique em &quot;Copiar SQL&quot;</li>
            <li>Abra o SQL Editor do Supabase</li>
            <li>Cole e clique em <strong>Run</strong></li>
            <li>Volte aqui e clique em &quot;Verificar&quot;</li>
          </ol>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" size="sm" variant="destructive" onClick={copySql}>
              <Copy className="mr-1.5 h-4 w-4" />
              Copiar SQL
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={getSupabaseSqlEditorUrl()} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Abrir SQL Editor
              </a>
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={checkSetup}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Verificar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetupBanner;
