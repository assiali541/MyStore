import { useGetSettings } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function About() {
  const { data: settings } = useGetSettings();

  return (
    <div className="w-full">
      <section className="relative pt-40 pb-24 md:pt-48 md:pb-32 bg-secondary/30 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <span className="text-muted-foreground tracking-[0.2em] uppercase text-sm mb-6 block">
            Our Story
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-foreground font-medium leading-tight">
            About {settings?.storeName || "Maison Luxe"}
          </h1>
        </div>
      </section>

      <section className="py-24 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-serif text-2xl md:text-3xl text-primary font-medium leading-relaxed mb-12">
            "True luxury is not about being noticed, but being remembered."
          </p>
          <p className="text-muted-foreground font-light leading-relaxed text-lg whitespace-pre-line">
            {settings?.aboutText ||
              "We source and sell 100% authentic clothing — every piece in our collection is guaranteed genuine, chosen with intention and crafted with mastery. No replicas, no compromises: just real, high-quality garments for those who understand the language of understated elegance.\n\nWe partner with trusted suppliers who share our devotion to authenticity, sourcing the finest materials and honoring time-tested techniques. The result is a wardrobe that transcends trends: timeless, considered, and unmistakably genuine."}
          </p>
        </div>
      </section>

      <section className="pb-24 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center border border-border/60 rounded-sm p-8">
          <h3 className="font-serif text-xl md:text-2xl text-foreground font-medium mb-3">Our Policy</h3>
          <p className="text-muted-foreground font-light leading-relaxed">
            All sales are final. We do not offer refunds or exchanges on any purchase, so please review your order carefully before checking out.
          </p>
        </div>
      </section>

      <section className="py-24 bg-primary text-primary-foreground px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">Discover the Collection</h2>
          <p className="text-primary-foreground/80 mb-8 font-light">
            Explore pieces crafted for the discerning individual.
          </p>
          <Button asChild size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary rounded-none px-8 h-14 tracking-wide uppercase text-sm">
            <Link href="/shop">Shop Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
