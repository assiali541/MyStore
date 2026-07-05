import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/contexts/cart-context";
import { useGetSettings, useValidateCoupon, useCreateOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChevronLeft, Lock } from "lucide-react";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const { data: settings } = useGetSettings();
  
  const [couponCode, setCouponCode] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<{code: string, amount: number} | null>(null);
  
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
    city: "",
    notes: ""
  });

  const validateCouponMutation = useValidateCoupon();
  const createOrderMutation = useCreateOrder();

  // Calculate totals
  const deliveryFee = settings?.deliveryFee || 0;
  const isFreeDelivery = settings?.freeDeliveryThreshold && subtotal >= settings.freeDeliveryThreshold;
  const finalDeliveryFee = isFreeDelivery ? 0 : deliveryFee;
  const discount = activeCoupon ? activeCoupon.amount : 0;
  const total = Math.max(0, subtotal + finalDeliveryFee - discount);

  if (items.length === 0 && !createOrderMutation.isSuccess) {
    return (
      <div className="pt-32 pb-24 text-center">
        <h1 className="font-serif text-3xl mb-4">Your Bag is Empty</h1>
        <Button asChild variant="outline" className="rounded-none">
          <Link href="/shop">Return to Shop</Link>
        </Button>
      </div>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await validateCouponMutation.mutateAsync({
        data: { code: couponCode, subtotal }
      });
      setActiveCoupon({
        code: res.code,
        amount: res.discountAmount
      });
      toast.success("Coupon applied successfully");
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired coupon");
      setActiveCoupon(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const orderItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color
      }));

      const res = await createOrderMutation.mutateAsync({
        data: {
          ...formData,
          couponCode: activeCoupon?.code,
          items: orderItems
        }
      });
      
      clearCart();
      setLocation(`/order-confirmation/${res.orderNumber}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to place order. Please try again.");
    }
  };

  return (
    <div className="pt-32 pb-24 px-4 md:px-6 container mx-auto">
      <Link href="/cart" className="flex items-center text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground mb-8 w-fit transition-colors">
        <ChevronLeft className="h-3 w-3 mr-1" /> Back to Bag
      </Link>
      
      <h1 className="font-serif text-3xl md:text-4xl text-foreground font-medium mb-12">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
        {/* Checkout Form */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div>
              <h2 className="font-serif text-2xl text-foreground mb-6 pb-2 border-b border-border">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-xs uppercase tracking-wider text-muted-foreground">Full Name *</Label>
                  <Input 
                    id="customerName" 
                    required 
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className="rounded-none border-border focus-visible:ring-primary h-12" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-muted-foreground">Phone / WhatsApp *</Label>
                  <Input 
                    id="phone" 
                    required 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="rounded-none border-border focus-visible:ring-primary h-12" 
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-serif text-2xl text-foreground mb-6 pb-2 border-b border-border">Delivery Details</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs uppercase tracking-wider text-muted-foreground">Full Address *</Label>
                  <Input 
                    id="address" 
                    required 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="rounded-none border-border focus-visible:ring-primary h-12" 
                  />
                </div>
                <div className="space-y-2 w-full md:w-1/2">
                  <Label htmlFor="city" className="text-xs uppercase tracking-wider text-muted-foreground">City *</Label>
                  <Input 
                    id="city" 
                    required 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="rounded-none border-border focus-visible:ring-primary h-12" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-xs uppercase tracking-wider text-muted-foreground">Delivery Instructions (Optional)</Label>
                  <Textarea 
                    id="notes" 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="rounded-none border-border focus-visible:ring-primary min-h-[100px] resize-none" 
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={createOrderMutation.isPending}
              className="w-full h-14 rounded-none bg-foreground text-background hover:bg-foreground/90 uppercase tracking-widest text-sm flex items-center justify-center gap-2"
            >
              {createOrderMutation.isPending ? "Processing..." : (
                <>
                  <Lock className="h-4 w-4" /> Place Order
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Order Summary sidebar */}
        <div className="w-full lg:w-[450px] shrink-0">
          <div className="bg-secondary/30 p-8 border border-border">
            <h2 className="font-serif text-xl text-foreground font-medium mb-6">In Your Bag</h2>
            
            <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item.cartItemId} className="flex gap-4">
                  <div className="w-16 aspect-[3/4] bg-background shrink-0 relative">
                    <img src={item.product.images?.[0] || "https://placehold.co/100"} alt={item.product.name} className="w-full h-full object-cover" />
                    <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(item.product.salePrice || item.product.price).toFixed(2)}</p>
                    {(item.size || item.color) && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.size} {item.size && item.color && '|'} {item.color}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-6 mb-6">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Gift Card or Discount Code</Label>
              <div className="flex gap-2">
                <Input 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter code" 
                  className="rounded-none border-border bg-background focus-visible:ring-primary h-12"
                />
                <Button 
                  type="button" 
                  onClick={handleApplyCoupon}
                  disabled={!couponCode || validateCouponMutation.isPending}
                  className="rounded-none h-12 px-6 uppercase tracking-widest text-xs"
                >
                  Apply
                </Button>
              </div>
              {activeCoupon && (
                <p className="text-primary text-xs mt-2 font-medium">
                  Coupon applied: -${activeCoupon.amount.toFixed(2)}
                </p>
              )}
            </div>
            
            <div className="space-y-3 text-sm border-t border-border pt-6 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                {isFreeDelivery ? (
                  <span className="font-medium text-primary">Complimentary</span>
                ) : (
                  <span className="font-medium text-foreground">${deliveryFee.toFixed(2)}</span>
                )}
              </div>
              {activeCoupon && (
                <div className="flex justify-between text-primary">
                  <span>Discount ({activeCoupon.code})</span>
                  <span className="font-medium">-${discount.toFixed(2)}</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-end border-t border-border pt-6">
              <span className="text-foreground uppercase tracking-widest text-sm">Total</span>
              <span className="font-serif text-2xl text-foreground">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
