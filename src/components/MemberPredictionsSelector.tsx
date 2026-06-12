import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/UserAvatar";
import type { BolaoMember } from "@/components/AdminPalpiteControl";

type MemberPredictionsSelectorProps = {
  members: BolaoMember[];
  selectedUserId: string | null;
  currentUserId: string;
  onSelect: (userId: string) => void;
  disabled?: boolean;
};

const MemberPredictionsSelector = ({
  members,
  selectedUserId,
  currentUserId,
  onSelect,
  disabled = false,
}: MemberPredictionsSelectorProps) => {
  const selected = members.find((m) => m.user_id === selectedUserId);

  return (
    <div className="rounded-lg border bg-card p-3">
      <label className="mb-2 block text-xs font-medium text-muted-foreground">
        Ver palpites de
      </label>
      <Select
        value={selectedUserId ?? undefined}
        onValueChange={onSelect}
        disabled={disabled || members.length === 0}
      >
        <SelectTrigger className="h-11">
          <SelectValue placeholder="Selecione um participante">
            {selected && (
              <span className="flex items-center gap-2">
                <UserAvatar
                  username={selected.username}
                  avatarUrl={selected.avatar_url}
                  size="sm"
                />
                <span>
                  @{selected.username}
                  {selected.user_id === currentUserId && (
                    <span className="ml-1 text-muted-foreground">(você)</span>
                  )}
                </span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {members.map((m) => (
            <SelectItem key={m.user_id} value={m.user_id}>
              <span className="flex items-center gap-2">
                <UserAvatar username={m.username} avatarUrl={m.avatar_url} size="sm" />
                <span>
                  @{m.username}
                  {m.user_id === currentUserId && (
                    <span className="ml-1 text-muted-foreground">(você)</span>
                  )}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedUserId && selectedUserId !== currentUserId && !disabled && (
        <p className="mt-2 text-xs text-muted-foreground">
          Visualizando palpites de <span className="font-medium">@{selected?.username}</span>{" "}
          (somente leitura)
        </p>
      )}
    </div>
  );
};

export default MemberPredictionsSelector;
