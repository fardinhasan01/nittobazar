import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Store, Grid3X3, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const items = [
    { path: '/', icon: Home, label: 'হোম' },
    { path: '/shop', icon: Store, label: 'শপ' },
    { path: '/categories', icon: Grid3X3, label: 'ক্যাটাগরি' },
    { path: '/cart', icon: ShoppingCart, label: 'কার্ট', badge: cartCount },
    { path: '/account', icon: User, label: 'অ্যাকাউন্ট' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-nav safe-bottom border-t">
      <div className="flex justify-around items-center px-2 py-2 max-w-lg mx-auto">
        {items.map(({ path, icon: Icon, label, badge }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={`relative flex flex-col items-center flex-1 py-2 rounded-2xl transition-all duration-300 min-h-[48px] justify-center ${
                active
                  ? 'text-brand-green'
                  : 'text-muted-foreground hover:text-brand-green'
              }`}
            >
              <Icon className={`w-6 h-6 mb-0.5 ${active ? 'scale-110' : ''} transition-transform duration-300`} />
              <span className="text-[10px] font-semibold">{label}</span>
              {badge != null && badge > 0 && (
                <span className="absolute top-1 right-1/4 translate-x-2 bg-brand-green text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
