import { useState, Fragment } from "react";
import { 
  useAdminListOrders, 
  useAdminUpdateOrderStatus,
  getAdminListOrdersQueryKey,
  AdminListOrdersStatus
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminListOrdersStatus | "all">("all");
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useAdminListOrders({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    status: statusFilter === "all" ? undefined : statusFilter
  });

  const updateStatusMutation = useAdminUpdateOrderStatus();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
    setPage(1);
  };

  const handleStatusChange = async (orderId: number, newStatus: "processing" | "delivered" | "cancelled") => {
    try {
      await updateStatusMutation.mutateAsync({
        id: orderId,
        data: { status: newStatus }
      });
      toast.success(`Order status updated to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: getAdminListOrdersQueryKey() });
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'delivered': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and track customer orders.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by order #, name or email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </form>
          
          <Select value={statusFilter} onValueChange={(val: any) => { setStatusFilter(val); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-4 font-medium">Order Details</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium text-right">Total</th>
                <th className="p-4 font-medium text-center w-40">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center"><div className="animate-pulse h-4 w-24 bg-muted mx-auto rounded"></div></td>
                </tr>
              ) : ordersData?.orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No orders found.</td>
                </tr>
              ) : (
                ordersData?.orders.map((order) => (
                  <Fragment key={order.id}>
                    <tr 
                      className={`hover:bg-muted/30 transition-colors cursor-pointer ${expandedOrderId === order.id ? 'bg-muted/30' : ''}`}
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {expandedOrderId === order.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-medium text-foreground">#{order.orderNumber}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.city}</p>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {format(new Date(order.createdAt), "MMM d, yyyy HH:mm")}
                      </td>
                      <td className="p-4 text-right font-medium text-foreground">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                        <Select 
                          value={order.status} 
                          onValueChange={(val: any) => handleStatusChange(order.id, val)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger className={`h-8 border-none ${getStatusColor(order.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                    
                    {/* Expanded details row */}
                    {expandedOrderId === order.id && (
                      <tr className="bg-muted/10 border-b border-border">
                        <td colSpan={5} className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b border-border">Order Items</h4>
                              <div className="space-y-4">
                                {order.items.map(item => (
                                  <div key={item.id} className="flex gap-4">
                                    <div className="w-12 h-16 bg-muted rounded overflow-hidden shrink-0">
                                      <img src={item.productImage || "https://placehold.co/50"} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-foreground">{item.productName}</p>
                                      <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                        <span>Qty: {item.quantity}</span>
                                        {(item.size || item.color) && (
                                          <span>• {item.color} {item.color && item.size && '|'} {item.size}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-sm font-medium text-foreground">
                                      ${item.totalPrice.toFixed(2)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="mt-6 space-y-2 text-sm border-t border-border pt-4 w-64 ml-auto">
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Subtotal</span>
                                  <span>${order.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Shipping</span>
                                  <span>${order.deliveryFee.toFixed(2)}</span>
                                </div>
                                {order.discount > 0 && (
                                  <div className="flex justify-between text-primary">
                                    <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                                    <span>-${order.discount.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-medium text-foreground pt-2 border-t border-border/50">
                                  <span>Total</span>
                                  <span>${order.total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b border-border">Customer Details</h4>
                              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                <div>
                                  <dt className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Name</dt>
                                  <dd className="font-medium text-foreground">{order.customerName}</dd>
                                </div>
                                <div>
                                  <dt className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Phone</dt>
                                  <dd className="font-medium text-foreground">{order.phone}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                  <dt className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Shipping Address</dt>
                                  <dd className="text-foreground">{order.address}<br/>{order.city}</dd>
                                </div>
                                {order.notes && (
                                  <div className="sm:col-span-2">
                                    <dt className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Notes</dt>
                                    <dd className="text-foreground bg-background p-3 rounded border border-border mt-1">{order.notes}</dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {ordersData && ordersData.totalPages > 1 && (
          <div className="p-4 border-t border-border flex justify-between items-center bg-muted/10">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, ordersData.total)} of {ordersData.total} orders
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === ordersData.totalPages} onClick={() => setPage(p => Math.min(ordersData.totalPages, p + 1))}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
