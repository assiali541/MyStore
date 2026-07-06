import { Link } from "wouter";
import { useGetSettings } from "@workspace/api-client-react";
import { Instagram, Mail, MessageCircle } from "lucide-react";

export function StoreFooter() {
  const { data: settings } = useGetSettings();

  return (
    <footer className="bg-foreground text-background py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-6">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={settings?.storeName || "Urban District LB"} className="h-8 object-contain brightness-0 invert" />
              ) : (
                <span className="font-serif text-3xl font-bold tracking-tight text-primary">
                  {settings?.storeName || "Urban District LB"}
                </span>
              )}
            </Link>
            <p className="text-background/70 max-w-sm font-light leading-relaxed">
              {settings?.aboutText || "100% authentic clothing, curated for the discerning individual, designed with intention and crafted with mastery."}
            </p>
          </div>
          
          <div>
            <h4 className="font-serif text-lg font-medium mb-6 text-primary">Explore</h4>
            <ul className="flex flex-col gap-4 font-light text-background/80">
              <li><Link href="/shop" className="hover:text-primary transition-colors">All Pieces</Link></li>
              <li><Link href="/categories" className="hover:text-primary transition-colors">Collections</Link></li>
              <li><Link href="/wishlist" className="hover:text-primary transition-colors">Wishlist</Link></li>
              <li><Link href="/cart" className="hover:text-primary transition-colors">Your Bag</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif text-lg font-medium mb-6 text-primary">Connect</h4>
            <ul className="flex flex-col gap-4 font-light text-background/80">
              {settings?.email && (
                <li>
                  <a href={`mailto:${settings.email}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                    <Mail className="h-4 w-4" />
                    <span>{settings.email}</span>
                  </a>
                </li>
              )}
              {settings?.whatsapp && (
                <li>
                  <a href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-primary transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp Us</span>
                  </a>
                </li>
              )}
              {settings?.instagramUrl && (
                <li>
                  <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-primary transition-colors">
                    <Instagram className="h-4 w-4" />
                    <span>Instagram</span>
                  </a>
                </li>
              )}
              {settings?.address && (
                <li className="pt-2">
                  <p className="text-sm opacity-60 leading-tight">{settings.address}</p>
                </li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="mt-16 md:mt-24 pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-light text-background/50">
            &copy; {new Date().getFullYear()} {settings?.storeName || "Urban District LB"}. All rights reserved. All items are 100% authentic. All sales are final — no refunds or exchanges.
          </p>
          <div className="flex items-center gap-4 text-xs font-light text-background/50">
            <Link href="/admin/login" className="hover:text-primary transition-colors">Admin Access</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
