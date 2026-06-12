import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_BOLAO_ID } from "@/lib/bolao-config";

/** Garante que o usuário participa do bolão único (idempotente). */
export async function ensureDefaultBolaoMembership(userId: string): Promise<void> {
  const { error: rpcError } = await supabase.rpc("ensure_default_bolao_membership");

  if (!rpcError) return;

  const msg = rpcError.message.toLowerCase();
  const rpcMissing =
    msg.includes("could not find the function") || msg.includes("schema cache");

  if (!rpcMissing) {
    console.warn("ensure_default_bolao_membership:", rpcError.message);
    return;
  }

  await supabase.from("bolao_members").upsert(
    { bolao_id: DEFAULT_BOLAO_ID, user_id: userId },
    { onConflict: "bolao_id,user_id", ignoreDuplicates: true }
  );
}
