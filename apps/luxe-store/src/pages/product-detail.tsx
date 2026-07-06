import { useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useGetProduct, useListProducts, getGetProductQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { useCart } from "@/contexts/cart-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ChevronRight, ChevronLeft, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id!);
  
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) }
  });

  const relatedParams = { categoryId: product?.categoryId ?? undefined, limit: 4 };
  const { data: relatedData } = useListProducts(relatedParams, {
    query: { enabled: !!product?.categoryId, queryKey: getListProductsQueryKey(relatedParams) }
  });

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  if (isLoading) {
    return (
      <div className="pt-32 pb-24 px-4 md:px-6 container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
          <Skeleton className="aspect-[3/4] w-full rounded-sm" />
          <div className="flex flex-col gap-6 pt-8">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-40 pb-24 text-center">
        <h1 className="font-serif text-3xl mb-4">Product Not Found</h1>
        <Button asChild variant="outline" className="rounded-none">
          <Link href="/shop">Return to Shop</Link>
        </Button>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const images = product.images?.length ? product.images : ["https://placehold.co/600x800/E8E4DF/333333?text=Maison+Luxe"];
  const relatedProducts = relatedData?.products.filter(p => p.id !== product.id).slice(0, 4) || [];

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return;
    }
    
    addToCart(product, quantity, selectedSize, selectedColor);
    toast.success("Added to your bag");
  };

  const toggleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
      toast.success("Added to wishlist");
    }
  };

  const nextImage = () => setActiveImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="pt-24 pb-24">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 md:px-6 mb-8 mt-4">
        <nav className="flex items-center text-xs text-muted-foreground uppercase tracking-widest gap-2">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
          {product.categoryName && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/shop?category=${product.categoryId}`} className="hover:text-primary transition-colors">
                {product.categoryName}
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
          {/* Images */}
          <div className="flex flex-col-reverse md:flex-row gap-4">
            {images.length > 1 && (
              <div className="flex md:flex-col gap-4 overflow-x-auto md:w-24 shrink-0 pb-2 md:pb-0">
                {images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    className={`aspect-[3/4] shrink-0 w-20 md:w-full border transition-all ${activeImage === idx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`${product.name} - ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            
            <div className="relative flex-1 aspect-[3/4] bg-secondary/50">
              <img 
                src={images[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background backdrop-blur-sm p-2 rounded-full transition-colors">
                    <ChevronLeft className="h-5 w-5 text-foreground" />
                  </button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background backdrop-blur-sm p-2 rounded-full transition-colors">
                    <ChevronRight className="h-5 w-5 text-foreground" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col pt-4 md:pt-10">
            <h1 className="font-serif text-3xl md:text-5xl text-foreground mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-8">
              {product.salePrice ? (
                <>
                  <span className="text-2xl text-foreground">${product.salePrice.toFixed(2)}</span>
                  <span className="text-lg text-muted-foreground line-through">${product.price.toFixed(2)}</span>
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 tracking-wider uppercase ml-2">Sale</span>
                </>
              ) : (
                <span className="text-2xl text-foreground">${product.price.toFixed(2)}</span>
              )}
            </div>

            <div className="prose prose-sm text-muted-foreground mb-10 max-w-none font-light leading-relaxed">
              <p>{product.description || "An exceptional piece crafted with the finest materials."}</p>
            </div>

            <div className="space-y-8 mb-10">
              {product.colors && product.colors.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium uppercase tracking-widest text-foreground">Color</span>
                    <span className="text-sm text-muted-foreground">{selectedColor || "Select"}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 text-sm border transition-colors ${selectedColor === color ? 'border-primary bg-primary/5 text-primary' : 'border-border text-foreground hover:border-primary/50'}`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium uppercase tracking-widest text-foreground">Size</span>
                    <span className="text-sm text-muted-foreground">{selectedSize || "Select"}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-12 h-12 flex items-center justify-center text-sm border transition-colors ${selectedSize === size ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground hover:border-primary/50'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-sm font-medium uppercase tracking-widest text-foreground block mb-3">Quantity</span>
                <div className="flex items-center border border-border w-32">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-medium text-foreground">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    +
                  </button>
                </div>
                {product.stock <= 5 && product.stock > 0 && (
                  <p className="text-xs text-primary mt-2">Only {product.stock} left in stock</p>
                )}
                {product.stock === 0 && (
                  <p className="text-xs text-destructive mt-2">Out of stock</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <Button 
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 h-14 rounded-none bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-sm"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                {product.stock === 0 ? "Out of Stock" : "Add to Bag"}
              </Button>
              <Button 
                variant="outline" 
                onClick={toggleWishlist}
                className={`h-14 w-full sm:w-14 shrink-0 rounded-none border-border hover:border-primary ${isWishlisted ? 'text-primary border-primary' : 'text-foreground'}`}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-primary' : ''}`} />
              </Button>
            </div>
            <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground tracking-wide">
             <span className="font-semibold text-foreground">Store Policy:</span> All sales are final. No refunds or exchanges.
              </p>
            
            {/* Shipping Info */}
            
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="container mx-auto px-4 md:px-6 mt-32">
          <h2 className="font-serif text-3xl text-foreground text-center mb-12">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(related => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
