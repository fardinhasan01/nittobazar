import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart,
  User,
  Menu,
  Search,
  Heart,
  Moon,
  Sun,
  Shield,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useTheme } from '@/context/ThemeContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const wishlistCount = wishlist.length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-nav shadow-md' : 'bg-white dark:bg-brand-charcoal border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 md:h-16 gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <img
              src="/logo.png"
              alt="নিত্য বাজার"
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300"
            />
            <div className="hidden sm:block">
              <span className="text-sm md:text-base font-bold text-brand-charcoal dark:text-white leading-none">
                নিত্য বাজার
              </span>
            </div>
          </Link>

          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md mx-4"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="পণ্য খুঁজুন..."
                className="pl-10 h-10 rounded-2xl bg-brand-gray dark:bg-white/10 border-0 focus-visible:ring-brand-green"
              />
            </div>
          </form>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl h-10 w-10"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl h-10 w-10 hidden sm:flex"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            <Link to="/account" className="hidden sm:flex">
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 relative" aria-label="Wishlist">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-green text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

            <Link to="/cart">
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 relative" aria-label="Cart">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-green text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            <Link to="/admin/login" className="hidden md:flex">
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10" aria-label="Admin login">
                <Shield className="w-5 h-5" />
              </Button>
            </Link>

            <Link to="/account" className="hidden md:flex">
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10" aria-label="Account">
                <User className="w-5 h-5" />
              </Button>
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-xl h-10 w-10" aria-label="Menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <nav className="flex flex-col gap-1 mt-8">
                  {[
                    { to: '/', label: 'হোম' },
                    { to: '/shop', label: 'শপ' },
                    { to: '/categories', label: 'ক্যাটাগরি' },
                    { to: '/cart', label: 'কার্ট' },
                    { to: '/account', label: 'অ্যাকাউন্ট' },
                    { to: '/admin/login', label: 'অ্যাডমিন লগইন' },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="px-4 py-3 rounded-xl font-medium hover:bg-brand-gray dark:hover:bg-white/10 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="px-4 py-3 rounded-xl font-medium text-left hover:bg-brand-gray dark:hover:bg-white/10 flex items-center gap-2"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {theme === 'dark' ? 'লাইট মোড' : 'ডার্ক মোড'}
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {mobileSearchOpen && (
          <form onSubmit={handleSearch} className="md:hidden pb-3 animate-fade-up">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="পণ্য খুঁজুন..."
                className="pl-10 h-11 rounded-2xl bg-brand-gray dark:bg-white/10"
                autoFocus
              />
            </div>
          </form>
        )}
      </div>
    </header>
  );
};

export default Header;
