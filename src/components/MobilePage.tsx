import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MobilePageProps = {
  children: ReactNode;
  className?: string;
  withBottomNav?: boolean;
};

export function MobilePage({ children, className, withBottomNav = false }: MobilePageProps) {
  return (
    <div
      className={cn(
        "flex min-h-[100dvh] flex-col bg-background",
        withBottomNav && "pb-nav",
        className
      )}
    >
      {children}
    </div>
  );
}
