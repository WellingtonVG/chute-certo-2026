import { NavLink } from "react-router-dom";
import { Home, Trophy, Calendar, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Feed", icon: Home, end: true },
  { to: "/bolao", label: "Bolão", icon: Trophy, end: false },
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
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default BottomNav;
