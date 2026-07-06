import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Package, Plus, ShoppingCart, LayoutDashboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { unlockAdminBodyScroll } from '@/lib/adminScrollLock';
import { isNativePlatform } from '@/lib/capacitor';

export type AdminTab = 'overview' | 'products' | 'orders' | 'add-product';

const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'add-product', label: 'Add', icon: Plus },
];

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  ordersCount?: number;
  newOrdersBadge?: number;
  children: React.ReactNode;
  topBanner?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  ordersCount = 0,
  newOrdersBadge = 0,
  children,
  topBanner,
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [activeTab]);

  useEffect(() => {
    document.documentElement.classList.add('admin-route');
    document.body.classList.add('admin-route');
    unlockAdminBodyScroll();
    return () => {
      document.documentElement.classList.remove('admin-route');
      document.body.classList.remove('admin-route');
      unlockAdminBodyScroll();
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      const id = window.setTimeout(unlockAdminBodyScroll, 100);
      return () => window.clearTimeout(id);
    }
  }, [menuOpen]);

  const selectTab = (tab: AdminTab) => {
    onTabChange(tab);
    setMenuOpen(false);
    const viewport = document.querySelector('.admin-scroll-viewport');
    if (viewport) {
      viewport.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goHome = (e: React.MouseEvent) => {
    if (isNativePlatform()) {
      e.preventDefault();
      navigate('/admin/dashboard');
      return;
    }
  };

  return (
    <div className="admin-shell bg-gradient-to-br from-[#f0f4f8] via-[#fdf6f0] to-[#fff] text-[#222]">
      {topBanner}

      <header className="admin-header sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-premium-200/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 h-14 sm:h-16">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0 h-11 w-11 touch-manipulation"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <img
              src="/logo.png"
              alt="নিত্য বাজার"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg shrink-0"
            />
            <div className="min-w-0">
              <a
                href={isNativePlatform() ? undefined : '/'}
                onClick={goHome}
                className="text-base sm:text-xl font-bold bg-gradient-to-r from-premium-600 to-emerald-600 bg-clip-text text-transparent truncate block"
              >
                নিত্য বাজার
              </a>
              <span className="text-xs text-gray-500">Admin panel</span>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            size="sm"
            className="border-red-400 text-red-500 hover:bg-red-50 min-h-10 touch-manipulation shrink-0"
          >
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <Sheet
        open={menuOpen}
        onOpenChange={(open) => {
          setMenuOpen(open);
          if (!open) unlockAdminBodyScroll();
        }}
      >
        <SheetContent side="left" className="w-[min(100vw-3rem,18rem)] p-0 flex flex-col max-h-[100dvh]">
          <SheetHeader className="p-4 border-b text-left shrink-0">
            <SheetTitle className="text-lg">Admin menu</SheetTitle>
          </SheetHeader>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-medium touch-manipulation min-h-12',
                  activeTab === id
                    ? 'bg-gradient-to-r from-premium-600 to-emerald-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
                {id === 'orders' && ordersCount > 0 && (
                  <span
                    className={cn(
                      'ml-auto text-xs px-2 py-0.5 rounded-full',
                      activeTab === id ? 'bg-white/20' : 'bg-gray-200 text-gray-700'
                    )}
                  >
                    {ordersCount}
                  </span>
                )}
                {id === 'orders' && newOrdersBadge > 0 && (
                  <span className="h-2.5 w-2.5 rounded-full bg-green-600 animate-pulse shrink-0" aria-hidden />
                )}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t safe-bottom shrink-0">
            <Button
              type="button"
              variant="ghost"
              className="w-full min-h-11 justify-start touch-manipulation"
              onClick={() => setMenuOpen(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Close menu
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="admin-scroll-viewport flex-1 min-h-0">
        <div className="max-w-7xl mx-auto w-full flex flex-col px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div
            className="admin-tab-bar overflow-x-auto -mx-1 px-1 pb-3 scrollbar-none"
            role="tablist"
            aria-label="Admin sections"
          >
            <div className="flex gap-2 min-w-max md:min-w-0 md:flex-wrap">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === id}
                  onClick={() => selectTab(id)}
                  className={cn(
                    'relative px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap touch-manipulation min-h-11 flex items-center gap-2 transition-all',
                    activeTab === id
                      ? 'bg-gradient-to-r from-premium-600 to-emerald-600 text-white shadow-md'
                      : 'bg-white/80 text-gray-600 border border-gray-200'
                  )}
                >
                  <Icon className="w-4 h-4 sm:hidden" />
                  <span>{label}</span>
                  {id === 'orders' && newOrdersBadge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-600 px-1 text-[10px] font-bold text-white">
                      {newOrdersBadge > 9 ? '9+' : newOrdersBadge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-page-content">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
