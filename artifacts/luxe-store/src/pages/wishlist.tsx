import { useWishlist } from "@/contexts/wishlist-context";
import { ProductCard } from "@/components/product-card";
import { Heart } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Wishlist() {
  const { items } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 px-4 md:px-6 container mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center">
        <Heart className="h-16 w-16 text-muted-foreground/30 mb-6" />
        <h1 className="font-serif text-3xl md:text-4xl text-foreground font-medium mb-4">Your Wishlist is Empty</h1>
        <p className="text-muted-foreground mb-8">Save your favorite pieces to access them later.</p>
        <Button asChild size="lg" className="rounded-none border-foreground text-foreground uppercase tracking-widest px-8" variant="outline">
          <Link href="/shop">
            Discover Collection
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-4 md:px-6 container mx-auto">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl text-foreground font-medium mb-4">Wishlist</h1>
        <p className="text-muted-foreground font-light">
          Your curated selection of favorite pieces.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-12">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
