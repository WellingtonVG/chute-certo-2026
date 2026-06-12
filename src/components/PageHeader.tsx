import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ThemeModeButton } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const headerButtonClass = "text-primary-foreground hover:bg-primary-foreground/10";

type PageHeaderProps = {
  title?: ReactNode;
  leading?: ReactNode;
  onBack?: () => void;
  actions?: ReactNode;
  className?: string;
  containerClassName?: string;
};

export function PageHeader({
  title,
  leading,
  onBack,
  actions,
  className,
  containerClassName,
}: PageHeaderProps) {
  return (
    <header className={cn("border-b bg-primary px-4 py-4 text-primary-foreground", className)}>
      <div className={cn("mx-auto flex max-w-lg items-center justify-between gap-3", containerClassName)}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {leading ?? (
            <>
              {onBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className={cn("shrink-0", headerButtonClass)}
                  aria-label="Voltar"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              {title &&
                (typeof title === "string" ? (
                  <h1 className="truncate text-xl font-bold">{title}</h1>
                ) : (
                  title
                ))}
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          <ThemeModeButton className={headerButtonClass} />
        </div>
      </div>
    </header>
  );
}
