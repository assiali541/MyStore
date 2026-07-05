import { useRoute, Link } from "wouter";
import { useGetOrderByNumber, getGetOrderByNumberQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, ChevronRight, Store } from "lucide-react";
import { format } from "date-fns";

export default function OrderConfirmation() {
  const [, params] = useRoute("/order-confirmation/:orderNumber");
  const orderNumber = params?.orderNumber || "";

  const { data: order, isLoading } = useGetOrderByNumber(orderNumber, {
    query: { enabled: !!orderNumber, queryKey: getGetOrderByNumberQueryKey(orderNumber) }
  });

  if (isLoading) {
    return (
      <div className="pt-40 pb-24 px-4 container mx-auto max-w-3xl">
        <div className="text-center mb-12 flex flex-col items-center">
          <Skeleton className="h-16 w-16 rounded-full mb-6" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-40 pb-24 text-center">
        <h1 className="font-serif text-3xl mb-4">Order Not Found</h1>
        <p className="text-muted-foreground mb-8">We couldn't find the details for this order.</p>
        <Button asChild variant="outline" className="rounded-none">
          <Link href="/shop">Return to Shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-4 container mx-auto max-w-3xl">
      <div className="text-center mb-16 flex flex-col items-center fade-in-up">
        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground font-medium mb-4">Merci, {order.customerName.split(' ')[0]}</h1>
        <p className="text-muted-foreground text-lg font-light">
          Your order has been placed successfully.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Order number: <span className="font-medium text-foreground">{order.orderNumber}</span>
        </p>
      </div>

      <div className="bg-secondary/30 border border-border p-6 md:p-10 mb-10">
        <h2 className="font-serif text-2xl text-foreground mb-8 pb-4 border-b border-border">Order Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Delivery Address</h3>
            <p className="text-sm text-foreground font-medium leading-relaxed">
              {order.customerName}<br/>
              {order.address}<br/>
              {order.city}<br/>
              {order.phone}
            </p>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Date</h3>
            <p className="text-sm text-foreground font-medium">
              {format(new Date(order.createdAt), "MMMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground pb-2 border-b border-border">Items</h3>
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="w-16 aspect-[3/4] bg-background shrink-0">
                <img src={item.productImage || "https://placehold.co/100"} alt={item.productName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-foreground">{item.productName}</p>
                  <p className="text-sm text-foreground">${item.totalPrice.toFixed(2)}</p>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span>Qty: {item.quantity}</span>
                  {(item.size || item.color) && (
                    <span>{item.color} {item.color && item.size && '|'} {item.size}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 text-sm border-t border-border pt-6">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground">${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium text-foreground">${order.deliveryFee.toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-primary">
              <span>Discount</span>
              <span className="font-medium">-${order.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
            <span className="text-foreground uppercase tracking-widest text-xs">Total</span>
            <span className="font-serif text-2xl text-foreground">${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button asChild variant="outline" className="rounded-none uppercase tracking-widest text-xs h-12 px-8">
          <Link href="/shop">
            <Store className="mr-2 h-4 w-4" /> Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}
