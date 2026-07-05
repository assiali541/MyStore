import { useAdminGetDashboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { 
  Package, 
  ShoppingBag, 
  CircleDollarSign, 
  Clock,
  ArrowUpRight
} from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading } = useAdminGetDashboard();

  if (isLoading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-8 w-48 bg-muted rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded"></div>)}
      </div>
    </div>;
  }

  if (!stats) return null;

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
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your store today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</h3>
            <CircleDollarSign className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-serif text-foreground">${stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Orders</h3>
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-serif text-foreground">{stats.totalOrders}</span>
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Products</h3>
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-serif text-foreground">{stats.totalProducts}</span>
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Processing</h3>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-serif text-foreground">{stats.processingOrders}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="font-serif text-xl text-foreground font-medium">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline flex items-center">
              View All <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 font-medium">Order</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">No recent orders found.</td>
                  </tr>
                ) : (
                  stats.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <Link href={`/admin/orders?id=${order.id}`} className="font-medium text-primary hover:underline">
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="p-4 text-foreground">{order.customerName}</td>
                      <td className="p-4 text-muted-foreground text-sm">{format(new Date(order.createdAt), "MMM d, yyyy")}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-foreground">${order.total.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="font-serif text-xl text-foreground font-medium">Top Sellers</h2>
            <Link href="/admin/products" className="text-sm text-primary hover:underline flex items-center">
              View All <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {stats.topProducts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Not enough data to determine top sellers yet.</p>
              ) : (
                stats.topProducts.map((product) => (
                  <div key={product.productId} className="flex items-center gap-4 p-2 hover:bg-muted/50 rounded-md transition-colors">
                    <img 
                      src={product.productImage || "https://placehold.co/100"} 
                      alt={product.productName} 
                      className="w-12 h-16 object-cover rounded bg-muted shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{product.productName}</p>
                      <p className="text-xs text-muted-foreground">{product.totalSold} sold</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-medium text-foreground">${product.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
