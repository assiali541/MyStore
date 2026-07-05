import { StoreNavbar } from "@/components/store-navbar";
import { StoreFooter } from "@/components/store-footer";
import { ReactNode } from "react";

export function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary selection:text-primary-foreground">
      <StoreNavbar />
      <main className="flex-1">
        {children}
      </main>
      <StoreFooter />
    </div>
  );
}
