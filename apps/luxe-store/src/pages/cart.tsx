import { useCart } from "@/contexts/cart-context";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag } from "lucide-react";
import { useGetSettings } from "@workspace/api-client-react";

export default function Cart() {
  const { items, updateQuantity, removeFromCart, subtotal } = useCart();
  const [, setLocation] = useLocation();
  const { data: settings } = useGetSettings();

  const deliveryFee = settings?.deliveryFee || 0;
  const freeThreshold = settings?.freeDeliveryThreshold;
  const isFreeDelivery = freeThreshold && subtotal >= freeThreshold;
  const finalDeliveryFee = isFreeDelivery ? 0 : deliveryFee;
  const total = subtotal + finalDeliveryFee;

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 px-4 md:px-6 container mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-6" />
        <h1 className="font-serif text-3xl md:text-4xl text-foreground font-medium mb-4">Your Bag is Empty</h1>
        <p className="text-muted-foreground mb-8">Discover our latest collections and find something extraordinary.</p>
        <Button asChild size="lg" className="rounded-none bg-foreground text-background uppercase tracking-widest px-8">
          <Link href="/shop">
            Continue Shopping
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-4 md:px-6 container mx-auto">
      <h1 className="font-serif text-3xl md:text-4xl text-foreground font-medium mb-12">Shopping Bag</h1>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
        {/* Cart Items */}
        <div className="flex-1">
          <div className="hidden sm:grid grid-cols-12 text-xs font-medium uppercase tracking-widest text-muted-foreground border-b border-border pb-4 mb-6">
            <div className="col-span-6">Product</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="flex flex-col gap-8">
            {items.map((item) => {
              const price = item.product.salePrice ?? item.product.price;
              const itemTotal = price * item.quantity;
              const image = item.product.images?.[0] || "https://placehold.co/150x200/E8E4DF/333333";

              return (
                <div key={item.cartItemId} className="grid sm:grid-cols-12 gap-4 items-center">
                  <div className="col-span-6 flex gap-4">
                    <Link href={`/products/${item.product.id}`} className="shrink-0">
                      <img src={image} alt={item.product.name} className="w-24 aspect-[3/4] object-cover bg-secondary" />
                    </Link>
                    <div className="flex flex-col py-1">
                      <Link href={`/products/${item.product.id}`} className="font-serif text-lg text-foreground hover:text-primary transition-colors">
                        {item.product.name}
                      </Link>
                      {(item.color || item.size) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.color} {item.color && item.size && '|'} {item.size}
                        </p>
                      )}
                      <button 
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 mt-auto pt-4 transition-colors uppercase tracking-wider w-fit"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-span-2 sm:text-center mt-2 sm:mt-0 font-medium text-foreground">
                    ${price.toFixed(2)}
                  </div>
                  
                  <div className="col-span-2 flex sm:justify-center">
                    <div className="flex items-center border border-border w-24">
                      <button 
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="w-8 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.cartItemId, Math.min(item.product.stock, item.quantity + 1))}
                        className="w-8 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-span-2 sm:text-right font-medium text-foreground hidden sm:block">
                    ${itemTotal.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-secondary/30 p-8">
            <h2 className="font-serif text-2xl text-foreground font-medium mb-6">Order Summary</h2>
            
            <div className="flex flex-col gap-4 text-sm border-b border-border pb-6 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm uppercase tracking-widest">Subtotal</span>
                <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm uppercase tracking-widest">Shipping</span>
                {isFreeDelivery ? (
                  <span className="font-medium text-primary uppercase tracking-widest text-xs">Complimentary</span>
                ) : (
                  <span className="font-medium text-foreground">${deliveryFee.toFixed(2)}</span>
                )}
              </div>
              {freeThreshold && !isFreeDelivery && (
                <p className="text-xs text-primary/80">
                  Add ${(freeThreshold - subtotal).toFixed(2)} more for complimentary shipping.
                </p>
              )}
            </div>
            
            <div className="flex justify-between mb-8">
              <span className="font-serif text-xl text-foreground">Total</span>
              <span className="font-serif text-xl text-foreground">${total.toFixed(2)}</span>
            </div>
            
            <Button 
              onClick={() => setLocation("/checkout")}
              className="w-full h-14 rounded-none bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-sm"
            >
              Proceed to Checkout
            </Button>
            
            <div className="mt-6 text-center text-xs text-muted-foreground flex flex-col gap-2">
              <p>Taxes and duties are calculated at checkout.</p>
              <p>Secure payment processing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
