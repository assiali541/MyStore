import { ReactNode, useEffect } from "react";
import { useAdminAuth } from "@/contexts/admin-auth-context";
import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Tags, 
  Ticket, 
  Settings as SettingsIcon, 
  LogOut, 
  Store,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useGetSettings } from "@workspace/api-client-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { token, logout, isLoading } = useAdminAuth();
  const [location, setLocation] = useLocation();
  const { data: settings } = useGetSettings();

  useEffect(() => {
    if (!isLoading && !token) {
      setLocation("/admin/login");
    }
  }, [token, isLoading, setLocation]);

  if (isLoading || !token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground font-serif">Authenticating...</p>
        </div>
      </div>
    );
  }

  const NavItems = () => (
    <>
      <div className="mb-8 px-2">
        <h2 className="font-serif text-xl font-bold text-sidebar-primary tracking-tight">
          {settings?.storeName || "Maison Luxe"}
        </h2>
        <p className="text-xs text-sidebar-foreground/50 uppercase tracking-widest mt-1">Atelier</p>
      </div>
      
      <div className="flex flex-col gap-1 flex-1">
        <Button asChild variant={location === "/admin" || location === "/admin/" ? "secondary" : "ghost"} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Link href="/admin">
            <LayoutDashboard className="mr-3 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button asChild variant={location.startsWith("/admin/orders") ? "secondary" : "ghost"} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Link href="/admin/orders">
            <ShoppingBag className="mr-3 h-4 w-4" />
            Orders
          </Link>
        </Button>
        <Button asChild variant={location.startsWith("/admin/products") ? "secondary" : "ghost"} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Link href="/admin/products">
            <Tags className="mr-3 h-4 w-4" />
            Products
          </Link>
        </Button>
        <Button asChild variant={location.startsWith("/admin/categories") ? "secondary" : "ghost"} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Link href="/admin/categories">
            <LayoutDashboard className="mr-3 h-4 w-4" />
            Categories
          </Link>
        </Button>
        <Button asChild variant={location.startsWith("/admin/coupons") ? "secondary" : "ghost"} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Link href="/admin/coupons">
            <Ticket className="mr-3 h-4 w-4" />
            Coupons
          </Link>
        </Button>
        <Button asChild variant={location.startsWith("/admin/settings") ? "secondary" : "ghost"} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Link href="/admin/settings">
            <SettingsIcon className="mr-3 h-4 w-4" />
            Store Settings
          </Link>
        </Button>
      </div>

      <div className="pt-4 border-t border-sidebar-border flex flex-col gap-2 mt-auto">
        <Button asChild variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent">
          <Link href="/">
            <Store className="mr-3 h-4 w-4" />
            Back to Store
          </Link>
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row dark">
      {/* Mobile Header */}
      <header className="md:hidden bg-sidebar text-sidebar-foreground h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <h2 className="font-serif text-lg font-bold text-sidebar-primary">
          {settings?.storeName || "Maison Luxe"}
        </h2>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] bg-sidebar text-sidebar-foreground border-sidebar-border p-4 flex flex-col dark">
            <NavItems />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-6 h-screen sticky top-0 shrink-0">
        <NavItems />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
