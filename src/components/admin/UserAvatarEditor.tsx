import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { removeUserAvatar, uploadUserAvatar } from "@/lib/avatars";
import { useToast } from "@/hooks/use-toast";

type UserAvatarEditorProps = {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  onUpdated: (avatarUrl: string | null) => void;
  compact?: boolean;
};

const UserAvatarEditor = ({
  userId,
  username,
  avatarUrl,
  onUpdated,
  compact = false,
}: UserAvatarEditorProps) => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    const { error, url } = await uploadUserAvatar(userId, file);
    setBusy(false);

    if (error) {
      toast({
        title: "Erro ao enviar foto",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    onUpdated(url);
    toast({ title: "Foto atualizada", description: `@${username}` });
  };

  const handleRemove = async () => {
    setBusy(true);
    const { error } = await removeUserAvatar(userId);
    setBusy(false);

    if (error) {
      toast({
        title: "Erro ao remover foto",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    onUpdated(null);
    toast({ title: "Foto removida", description: `@${username}` });
  };

  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center gap-3"}>
      <UserAvatar username={username} avatarUrl={avatarUrl} size={compact ? "sm" : "md"} />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size={compact ? "icon" : "sm"}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          title="Alterar foto"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {!compact && <span className="ml-2">Alterar foto</span>}
        </Button>
        {avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={busy}
            onClick={() => void handleRemove()}
            title="Remover foto"
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserAvatarEditor;
