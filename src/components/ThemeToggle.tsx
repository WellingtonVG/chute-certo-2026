import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const;

type ThemeValue = (typeof options)[number]["value"];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={cn("grid grid-cols-3 gap-2", className)}>
        {options.map(({ value, label }) => (
          <Button key={value} variant="outline" size="sm" disabled className="h-10">
            {label}
          </Button>
        ))}
      </div>
    );
  }

  const current = (theme ?? "system") as ThemeValue;

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {options.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          type="button"
          variant={current === value ? "default" : "outline"}
          size="sm"
          className="h-10 gap-2"
          onClick={() => setTheme(value)}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}

export function ThemeCornerButton({ className }: { className?: string }) {
  return (
    <div className={cn("fixed top-4 right-4 z-50", className)}>
      <ThemeModeButton variant="outline" className="bg-background/90 shadow-sm backdrop-blur" />
    </div>
  );
}

export function ThemeModeButton({
  className,
  variant = "ghost",
}: {
  className?: string;
  variant?: "ghost" | "outline";
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant={variant} size="icon" className={className} disabled aria-label="Tema">
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      className={className}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
