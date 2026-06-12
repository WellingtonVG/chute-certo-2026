import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(username: string) {
  const clean = username.replace(/[^a-zA-Z0-9]/g, "");
  return (clean.slice(0, 2) || username.slice(0, 2) || "?").toUpperCase();
}

type UserAvatarProps = {
  username: string;
  avatarUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-24 w-24 text-xl",
};

export function UserAvatar({ username, avatarUrl, className, size = "md" }: UserAvatarProps) {
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={username} /> : null}
      <AvatarFallback className="font-semibold">{initials(username)}</AvatarFallback>
    </Avatar>
  );
}
