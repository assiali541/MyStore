import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

// Contexts
import { CartProvider } from '@/contexts/cart-context';
import { WishlistProvider } from '@/contexts/wishlist-context';
import { AdminAuthProvider } from '@/contexts/admin-auth-context';

// Layouts
import { StoreLayout } from '@/layouts/store-layout';
import { AdminLayout } from '@/layouts/admin-layout';

// Store Pages
import Home from '@/pages/home';
import Shop from '@/pages/shop';
import ProductDetail from '@/pages/product-detail';
import Categories from '@/pages/categories';
import Cart from '@/pages/cart';
import Checkout from '@/pages/checkout';
import OrderConfirmation from '@/pages/order-confirmation';
import Wishlist from '@/pages/wishlist';
import About from '@/pages/about';
import Contact from '@/pages/contact';

// Admin Pages
import AdminLogin from '@/pages/admin/login';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminProducts from '@/pages/admin/products';
import AdminCategories from '@/pages/admin/categories';
import AdminOrders from '@/pages/admin/orders';
import AdminCoupons from '@/pages/admin/coupons';
import AdminSettings from '@/pages/admin/settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function StoreRoutes() {
  return (
    <StoreLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shop" component={Shop} />
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/categories" component={Categories} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/order-confirmation/:orderNumber" component={OrderConfirmation} />
        <Route path="/wishlist" component={Wishlist} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route component={NotFound} />
      </Switch>
    </StoreLayout>
  );
}

function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/coupons" component={AdminCoupons} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Admin login has no layout wrapper */}
      <Route path="/admin/login" component={AdminLogin} />
      {/* Admin namespace gets priority over the store catch-all */}
      <Route path="/admin" component={AdminRoutes} />
      <Route path="/admin/dashboard" component={AdminRoutes} />
      <Route path="/admin/products" component={AdminRoutes} />
      <Route path="/admin/categories" component={AdminRoutes} />
      <Route path="/admin/orders" component={AdminRoutes} />
      <Route path="/admin/coupons" component={AdminRoutes} />
      <Route path="/admin/settings" component={AdminRoutes} />
      {/* Everything else falls back to store */}
      <Route component={StoreRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminAuthProvider>
          <CartProvider>
            <WishlistProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                <Router />
              </WouterRouter>
              <Toaster position="top-center" />
            </WishlistProvider>
          </CartProvider>
        </AdminAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
