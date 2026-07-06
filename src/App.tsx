import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from 'lucide-react';
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Categories from "./pages/Categories";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import TopBanner from './components/TopBanner';
import FloatingContactButton from './components/FloatingContactButton';
import BackToTop from './components/BackToTop';

const AdminLogin = React.lazy(() => import('./pages/admin/Login'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));

const AdminRouteFallback = () => (
  <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#f0f4f8] via-[#fdf6f0] to-[#fff]">
    <Loader2 className="w-10 h-10 animate-spin text-premium-600" />
  </div>
);

const queryClient = new QueryClient();

const ScrollToTopOnce: React.FC = () => {
  const location = useLocation();
  React.useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      window.scrollTo(0, 0);
      return;
    }
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);
  return null;
};

const MainLayout = () => (
  <>
    <TopBanner />
    <Header />
    <main className="pb-20 md:pb-0 min-h-[calc(100vh-8rem)]">
      <Outlet />
    </main>
    <BottomNav />
    <FloatingContactButton />
    <BackToTop />
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="premium-bg" aria-hidden="true">
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />
      </div>
      <BrowserRouter>
        <ScrollToTopOnce />
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/account" element={<Account />} />
          </Route>

          <Route
            path="/admin/login"
            element={
              <React.Suspense fallback={<AdminRouteFallback />}>
                <AdminLogin />
              </React.Suspense>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <React.Suspense fallback={<AdminRouteFallback />}>
                <AdminDashboard />
              </React.Suspense>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
