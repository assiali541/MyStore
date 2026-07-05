import { Link, useLocation } from "wouter";
import { useCart } from "@/contexts/cart-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { ShoppingBag, Heart, Menu, Search, ChevronDown } from "lucide-react";
import { useGetSettings } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StoreNavbar() {
  const [location] = useLocation();
  const { items: cartItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { data: settings } = useGetSettings();
  
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const isShopActive = location.startsWith("/shop") || location.startsWith("/categories");

  const DesktopNavLinks = () => (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`flex items-center gap-1 text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors ${isShopActive ? "text-primary" : "text-foreground"}`}
          >
            Shop
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="rounded-none min-w-[180px]">
          <DropdownMenuItem asChild>
            <Link href="/shop" className="text-sm tracking-wide uppercase w-full cursor-pointer">All Pieces</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/categories" className="text-sm tracking-wide uppercase w-full cursor-pointer">Collections</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Link href="/about" className={`text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors ${location.startsWith("/about") ? "text-primary" : "text-foreground"}`}>About Us</Link>
      <Link href="/contact" className={`text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors ${location.startsWith("/contact") ? "text-primary" : "text-foreground"}`}>Contact Us</Link>
    </>
  );

  const MobileNavLinks = () => (
    <>
      <div className="flex flex-col gap-3">
        <Link href="/shop" className={`text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors ${location.startsWith("/shop") ? "text-primary" : "text-foreground"}`}>Shop</Link>
        <Link href="/categories" className={`pl-4 text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors ${location.startsWith("/categories") ? "text-primary" : "text-muted-foreground"}`}>— Collections</Link>
      </div>
      <Link href="/about" className={`text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors ${location.startsWith("/about") ? "text-primary" : "text-foreground"}`}>About Us</Link>
      <Link href="/contact" className={`text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors ${location.startsWith("/contact") ? "text-primary" : "text-foreground"}`}>Contact Us</Link>
    </>
  );

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm py-4" : "bg-transparent py-6"}`}>
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] flex flex-col pt-12">
              <nav className="flex flex-col gap-6">
                <MobileNavLinks />
              </nav>
            </SheetContent>
          </Sheet>
          
          <nav className="hidden md:flex items-center gap-8">
            <DesktopNavLinks />
          </nav>
        </div>

        <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt={settings?.storeName || "Maison Luxe"} className="h-8 md:h-10 object-contain" />
          ) : (
            <span className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {settings?.storeName || "Maison Luxe"}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/shop" className="hidden sm:flex items-center justify-center h-10 w-10 text-foreground hover:text-primary transition-colors">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/wishlist" className="relative flex items-center justify-center h-10 w-10 text-foreground hover:text-primary transition-colors">
            <Heart className="h-5 w-5" />
            {wishlistItems.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
            )}
          </Link>
          <Link href="/cart" className="relative flex items-center justify-center h-10 w-10 text-foreground hover:text-primary transition-colors">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
