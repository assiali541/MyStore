import { Link } from "wouter";
import { Product } from "@workspace/api-client-react";
import { useWishlist } from "@/contexts/wishlist-context";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProductCard({ product }: { product: Product }) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0;

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const image =
    product.images?.[0] ||
    "https://placehold.co/600x800/E8E4DF/333333?text=Urban+District+LB";

  return (
    <div className="group block relative">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary/50 rounded-sm mb-4">
          <img
            src={image}
            alt={product.name}
            className={`object-cover w-full h-full transition-transform duration-700 group-hover:scale-105 ${
              isOutOfStock ? "opacity-60 grayscale" : ""
            }`}
            loading="lazy"
          />

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
              <span className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest">
                Out of Stock
              </span>
            </div>
          )}

          {!isOutOfStock && product.salePrice && (
            <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 tracking-wider uppercase">
              Sale
            </div>
          )}
        </div>
      </Link>

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 z-20 bg-background/50 backdrop-blur-md border border-border/50 hover:bg-background transition-colors rounded-full opacity-0 group-hover:opacity-100 h-8 w-8"
        onClick={toggleWishlist}
      >
        <Heart
          className={`h-4 w-4 ${
            isWishlisted ? "fill-primary text-primary" : "text-foreground"
          }`}
        />
      </Button>

      <Link href={`/products/${product.id}`} className="flex flex-col gap-1 block">
        <h3 className="font-serif text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {product.name}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-1">
          {product.categoryName}
        </p>

        <div className="flex items-center gap-2 mt-1">
          {product.salePrice ? (
            <>
              <span className="font-medium text-foreground">
                ${product.salePrice.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                ${product.price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="font-medium text-foreground">
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>

        {isOutOfStock && (
          <p className="text-xs text-destructive uppercase tracking-widest mt-1">
            Out of Stock
          </p>
        )}
      </Link>
    </div>
  );
}