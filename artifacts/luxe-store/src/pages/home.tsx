import { useListProducts, useGetSettings, useListCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { CategoryCard } from "@/components/category-card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@assets/generated_images/hero_boy_realistic.png";

export default function Home() {
  const { data: settings } = useGetSettings();
  
  const { data: featuredProducts } = useListProducts({ featured: true, limit: 4 });
  const { data: categories } = useListCategories();

  const heroUrl = settings?.heroImageUrl || heroImage;

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroUrl} 
            alt="Maison Luxe Hero" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <span className="text-white/80 tracking-[0.2em] uppercase text-sm mb-6 block fade-in-up" style={{animationDelay: "0.1s"}}>
            {settings?.storeName || "Maison Luxe"}
          </span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white font-medium leading-tight mb-8 fade-in-up" style={{animationDelay: "0.2s"}}>
            The Art of<br />Understated Elegance
          </h1>
          <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 rounded-none px-8 h-14 tracking-wide uppercase text-sm fade-in-up" style={{animationDelay: "0.3s"}}>
            <Link href="/shop">
              Explore Collection
            </Link>
          </Button>
        </div>
      </section>

      {/* Brand Story Strip */}
      <section className="py-24 bg-secondary/30 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl text-primary font-medium leading-relaxed">
            "True luxury is not about being noticed, but being remembered. Every piece we sell is 100% authentic, sourced and curated for those who appreciate the quiet language of exceptional quality."
          </h2>
        </div>
      </section>

      {/* Featured Categories */}
      {categories && categories.length > 0 && (
        <section className="py-24 px-4 md:px-6 container mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground font-medium mb-2">Curated Collections</h2>
              <p className="text-muted-foreground text-sm uppercase tracking-widest">Seasonal Edit</p>
            </div>
            <Link href="/categories" className="hidden md:flex items-center text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.slice(0, 3).map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Button asChild variant="outline" className="rounded-none uppercase tracking-wide">
              <Link href="/categories">
                View All Collections
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts && featuredProducts.products.length > 0 && (
        <section className="py-24 px-4 md:px-6 container mx-auto border-t border-border/50">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-foreground font-medium mb-2">Signature Pieces</h2>
              <p className="text-muted-foreground text-sm uppercase tracking-widest">Iconic Designs</p>
            </div>
            <Link href="/shop" className="hidden md:flex items-center text-sm font-medium tracking-wide uppercase hover:text-primary transition-colors">
              Shop All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-6 gap-y-12">
            {featuredProducts.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="py-24 bg-primary text-primary-foreground px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">Join the Atelier</h2>
          <p className="text-primary-foreground/80 mb-8 font-light">
            Subscribe to receive exclusive access to new collections, private sales, and sartorial inspiration.
          </p>
          <form className="flex flex-col sm:flex-row max-w-md mx-auto gap-2" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1 bg-transparent border-b border-primary-foreground/30 px-0 py-3 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:border-primary-foreground transition-colors rounded-none"
              required
            />
            <Button type="submit" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary rounded-none mt-4 sm:mt-0 px-8">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
