import React from 'react';
import {
  ArrowRight,
  House,
  LayoutGrid,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const slides = [
  {
    src: '/dashboard-banners/big_banner_1__13.jpg',
    alt: 'Promotional sports banner',
    accent: 'from-blue-500/80 via-sky-400/30 to-transparent',
  },
  {
    src: '/dashboard-banners/image-resize.avif',
    alt: 'Promotional product banner',
    accent: 'from-emerald-500/80 via-teal-400/30 to-transparent',
  },
];

const repeatedSlides = [...slides, ...slides];

const quickLinks = [
  { to: '/', label: 'হোম', icon: House },
  { to: '/shop', label: 'শপ', icon: ShoppingBag },
  { to: '/categories', label: 'ক্যাটাগরি', icon: LayoutGrid },
  { to: '/cart', label: 'কার্ট', icon: ShoppingCart },
  { to: '/account', label: 'অ্যাকাউন্ট', icon: UserRound },
];

const PromoScrollBanner: React.FC = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
      <div className="grid gap-3 lg:grid-cols-[minmax(180px,0.34fr)_minmax(0,0.66fr)]">
        <aside className="rounded-3xl border border-white/70 bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="mb-3">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-premium-200 bg-premium-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-premium-700">
              <Sparkles className="h-3.5 w-3.5" />
              Quick shop
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {quickLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full justify-start gap-2 border-premium-200 bg-white text-brand-charcoal hover:bg-premium-50"
                >
                  <Icon className="h-4 w-4 text-premium-600" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        </aside>

        <div className="overflow-hidden rounded-3xl border border-white/70 bg-[#081427] text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
            <div className="max-w-2xl">
              <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                Featured campaigns
              </div>
              <h2 className="text-sm font-black text-white sm:text-lg">Scrolling banner highlights</h2>
            </div>

            <Link to="/shop" className="shrink-0">
              <Button className="h-9 bg-white text-brand-green hover:bg-brand-gray">
                এখনই দেখুন
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-b from-white/5 to-transparent">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#081427] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#081427] to-transparent" />

            <div className="scroll-banner-track py-3">
              {repeatedSlides.map((slide, index) => (
                <div
                  key={`${slide.src}-${index}`}
                  className={cn(
                    'scroll-banner-card relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-lg',
                    'min-w-[200px] sm:min-w-[250px] lg:min-w-[270px]'
                  )}
                >
                  <div className="aspect-[16/7] w-full">
                    <img
                      src={slide.src}
                      alt={slide.alt}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className={cn('absolute inset-0 bg-gradient-to-r opacity-90', slide.accent)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoScrollBanner;
