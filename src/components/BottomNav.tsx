import { NavLink } from "react-router-dom";
import { Home, Trophy, Calendar, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_BOLAO_PATH } from "@/lib/bolao-config";

const items = [
  { to: "/", label: "Feed", icon: Home, end: true },
  { to: DEFAULT_BOLAO_PATH, label: "Bolão", icon: Trophy, end: false },
  { to: "/calendario", label: "Calendário", icon: Calendar, end: false },
  { to: "/quiz", label: "Quiz", icon: HelpCircle, end: false },
];

const BottomNav = () => {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors sm:text-xs",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default BottomNav;
