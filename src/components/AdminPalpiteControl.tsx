import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type BolaoMember = {
  user_id: string;
  username: string;
};

interface AdminPalpiteControlProps {
  members: BolaoMember[];
  targetUserId: string | null;
  targetUsername: string | null;
  onSelectUser: (userId: string) => void;
  onClear: () => void;
}

const AdminPalpiteControl = ({
  members,
  targetUserId,
  targetUsername,
  onSelectUser,
  onClear,
}: AdminPalpiteControlProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string>("");

  const isActive = !!targetUserId;

  const handlePadlockClick = () => {
    if (isActive) {
      onClear();
      return;
    }
    setPendingUserId("");
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!pendingUserId) return;
    onSelectUser(pendingUserId);
    setDialogOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant={isActive ? "default" : "outline"}
        size="icon"
        className="absolute right-0 top-0 z-10 h-9 w-9 shrink-0 shadow-sm"
        onClick={handlePadlockClick}
        aria-label={isActive ? "Sair do modo admin" : "Registrar palpite retroativo"}
        title={isActive ? "Sair do modo admin" : "Registrar palpite retroativo"}
      >
        {isActive ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      </Button>

      {isActive && targetUsername && (
        <div className="mb-3 mt-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 pr-12 text-sm">
          <span className="font-medium text-amber-900 dark:text-amber-100">
            Modo admin · palpite de{" "}
            <span className="font-bold">@{targetUsername}</span>
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Prazos ignorados — registre palpites enviados por outro meio.
          </p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar palpite retroativo</DialogTitle>
            <DialogDescription>
              Selecione o participante para registrar ou corrigir palpites após o prazo.
            </DialogDescription>
          </DialogHeader>
          <Select value={pendingUserId} onValueChange={setPendingUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um participante" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  @{m.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!pendingUserId}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminPalpiteControl;
