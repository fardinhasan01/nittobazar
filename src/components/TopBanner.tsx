import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BadgePercent, LayoutGrid, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const banners = [
  {
    title: 'আজকের সেরা অফার',
    subtitle: 'প্রিমিয়াম গ্যাজেটে সীমিত সময়ের ডিসকাউন্ট',
    image: '/dashboard-banners/big_banner_1__13.jpg',
    href: '/shop?category=Gaming',
  },
  {
    title: 'নতুন এসেছে',
    subtitle: 'স্মার্টফোন, অ্যাক্সেসরিজ আর গ্যাজেটের তাজা কালেকশন',
    image: '/dashboard-banners/image-resize.avif',
    href: '/shop',
  },
];

const quickLinks = [
  { to: '/shop', label: 'সব পণ্য', icon: Sparkles },
  { to: '/categories', label: 'ক্যাটাগরি', icon: LayoutGrid },
  { to: '/shop?category=Smartphones', label: 'স্মার্টফোন', icon: Smartphone },
];

const TopBanner = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  const banner = banners[active];

  return (
    <div className="relative z-40 overflow-hidden border-b border-white/10 bg-[#0f172a] text-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.title}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35 }}
          className="h-full"
        >
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
            <div className="grid items-center gap-3 lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
              <div className="flex flex-wrap items-center gap-2">
                {quickLinks.map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to}>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 rounded-full border border-white/10 bg-white/10 px-3 text-[11px] font-semibold text-white hover:bg-white/20 hover:text-white"
                    >
                      <Icon className="mr-1.5 h-3.5 w-3.5" />
                      {label}
                    </Button>
                  </Link>
                ))}
              </div>

              <Link to={banner.href} className="block">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#07111f] via-[#132f67] to-[#0d1b2f]" />
                  <div className="absolute inset-0 opacity-45">
                    <img src={banner.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="relative flex min-h-14 items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                        <BadgePercent className="h-4 w-4" />
                      </div>
                      <div className="leading-tight">
                        <p className="text-xs font-bold sm:text-sm">{banner.title}</p>
                        <p className="text-[10px] text-white/80 sm:text-xs">{banner.subtitle}</p>
                      </div>
                    </div>
                    <div className="hidden items-center gap-2 text-xs font-semibold sm:flex">
                      এখনই দেখুন
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TopBanner;
