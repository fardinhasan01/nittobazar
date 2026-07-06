import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Laptop2,
  ShoppingCart,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stars,
  Watch,
  Gamepad2,
  Wifi,
  BriefcaseBusiness,
  Home,
  LampDesk,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ProductLike = {
  id: string;
  name: string;
  category?: string;
  featured?: boolean;
  offerPrice?: number | null;
  mainPrice?: number;
};

interface HeroSectionProps {
  products?: ProductLike[];
}

const carouselSlides = [
  {
    title: 'মেগা ডিসকাউন্ট',
    subtitle: 'প্রিমিয়াম টেকে দারুণ সাশ্রয়',
    image: '/dashboard-banners/big_banner_1__13.jpg',
    cta: 'গেমিং দেখুন',
    href: '/shop?category=Gaming',
    badge: '৪০% পর্যন্ত ছাড়',
    tint: 'from-blue-700/80 via-blue-600/35 to-slate-950/20',
  },
  {
    title: 'নতুন পণ্য',
    subtitle: 'স্মার্ট অ্যাক্সেসরিজ আর নতুন গ্যাজেট',
    image: '/dashboard-banners/image-resize.avif',
    cta: 'নতুনগুলো দেখুন',
    href: '/shop',
    badge: 'সীমিত স্টক',
    tint: 'from-emerald-700/80 via-emerald-600/30 to-slate-950/20',
  },
];

const categories = [
  { label: 'স্মার্টফোন', icon: Smartphone, slug: 'Smartphones' },
  { label: 'ল্যাপটপ', icon: Laptop2, slug: 'Laptops' },
  { label: 'গেমিং', icon: Gamepad2, slug: 'Gaming' },
  { label: 'অ্যাক্সেসরিজ', icon: Sparkles, slug: 'Accessories' },
  { label: 'স্মার্ট ওয়াচ', icon: Watch, slug: 'Smart Watches' },
  { label: 'অডিও', icon: Headphones, slug: 'Audio' },
  { label: 'ক্যামেরা', icon: Camera, slug: 'Cameras' },
  { label: 'হোম অ্যাপ্লায়েন্স', icon: Home, slug: 'Home Appliances' },
  { label: 'নেটওয়ার্কিং', icon: Wifi, slug: 'Networking' },
  { label: 'অফিস', icon: BriefcaseBusiness, slug: 'Office' },
  { label: 'লাইফস্টাইল', icon: LampDesk, slug: 'Lifestyle' },
];

const featureCards = [
  { label: 'ফ্রি ডেলিভারি', icon: BadgeCheck, desc: 'দ্রুত হোম ডেলিভারি' },
  { label: 'অফিশিয়াল ওয়ারেন্টি', icon: ShieldCheck, desc: 'বিশ্বস্ত পণ্য' },
  { label: 'ইএমআই সুবিধা', icon: Stars, desc: 'সহজ কিস্তি সুবিধা' },
  { label: 'ফ্ল্যাশ ডিল', icon: Sparkles, desc: 'সীমিত সময়ের অফার' },
  { label: 'বেস্ট সেলার', icon: ShoppingCart, desc: 'ক্রেতাদের পছন্দের পণ্য' },
  { label: 'এক্সক্লুসিভ অফার', icon: BadgeCheck, desc: 'বিশেষ সদস্য মূল্য' },
];

const HeroSection: React.FC<HeroSectionProps> = ({ products = [] }) => {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % carouselSlides.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const seen = new Set<string>();
    const items: { label: string; to: string; helper: string }[] = [];

    for (const product of products) {
      const name = product.name || '';
      const category = product.category || '';
      if (
        name.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q) ||
        `${name} ${category}`.toLowerCase().includes(q)
      ) {
        const key = `${name}-${category}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({
          label: name,
          to: `/shop?q=${encodeURIComponent(name)}`,
          helper: category || 'পণ্য',
        });
      }
      if (items.length >= 5) break;
    }

    if (items.length < 5) {
      for (const category of categories) {
        if (category.label.toLowerCase().includes(q) && !seen.has(category.label)) {
          items.push({
            label: category.label,
            to: `/shop?category=${encodeURIComponent(category.slug)}`,
            helper: 'ক্যাটাগরি',
          });
        }
        if (items.length >= 5) break;
      }
    }

    return items.slice(0, 5);
  }, [products, query]);

  const current = carouselSlides[active];

  return (
    <section className="px-4 sm:px-6 pt-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="glass-card overflow-hidden border border-green-100/70 bg-white/95 p-3 shadow-lg dark:bg-brand-charcoal/95">
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-premium-600">
                ক্যাটাগরি দেখুন
              </p>
              <h2 className="mt-1 text-lg font-black text-brand-charcoal dark:text-white">
                জনপ্রিয় ক্যাটাগরি
              </h2>
            </div>
            <div className="max-h-[440px] space-y-1 overflow-y-auto pr-1">
              {categories.map((category) => (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => navigate(`/shop?category=${encodeURIComponent(category.slug)}`)}
                  className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all hover:bg-premium-50 dark:hover:bg-white/5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-premium-50 text-premium-700 transition-transform group-hover:scale-105 dark:bg-white/5">
                    <category.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-brand-charcoal dark:text-white">
                      {category.label}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-4">
            <div className="glass-card overflow-hidden border border-green-100/70 shadow-xl">
              <div className="grid gap-0 lg:grid-cols-[1.05fr_minmax(0,1.35fr)]">
                <div className="relative flex flex-col justify-between bg-gradient-to-br from-brand-green via-emerald-600 to-slate-900 p-5 text-white sm:p-6">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_35%)]" />
                  <div className="relative z-10">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                      <Sparkles className="h-3.5 w-3.5" />
                      প্রিমিয়াম শপিং এক্সপেরিয়েন্স
                    </span>
                    <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
                      আপনার জন্য প্রিমিয়াম টেক ডিল, এখন আরও সহজে।
                    </h1>
                    <p className="mt-3 max-w-md text-sm text-white/85 sm:text-base">
                      স্মার্টফোন, অ্যাক্সেসরিজ আর গ্যাজেট এক জায়গায় খুঁজুন। দ্রুত, পরিষ্কার আর বিশ্বস্ত কেনাকাটার অভিজ্ঞতা।
                    </p>
                  </div>

                  <div className="relative z-10 mt-6">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="পণ্য, ব্র্যান্ড, ক্যাটাগরি খুঁজুন..."
                        className="h-14 rounded-2xl border-0 bg-white pl-12 pr-4 text-base text-brand-charcoal shadow-lg placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white/60"
                      />
                    </div>
                    {suggestions.length > 0 && (
                      <div className="mt-2 overflow-hidden rounded-2xl border border-white/15 bg-slate-950/70 p-2 backdrop-blur">
                        {suggestions.map((suggestion) => (
                          <button
                            key={`${suggestion.label}-${suggestion.to}`}
                            type="button"
                            onClick={() => navigate(suggestion.to)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-white/10"
                          >
                            <span>
                              <span className="block font-semibold text-white">{suggestion.label}</span>
                              <span className="block text-xs text-white/60">{suggestion.helper}</span>
                            </span>
                            <ArrowRight className="h-4 w-4 text-white/60" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative min-h-[340px] overflow-hidden bg-slate-950">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={current.title}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.45 }}
                      className="absolute inset-0"
                    >
                      <div className="relative h-full">
                        <img
                          src={current.image}
                          alt={current.title}
                          className="h-full w-full object-cover"
                          loading="eager"
                        />
                        <div className={cn('absolute inset-0 bg-gradient-to-r', current.tint)} />
                        <div className="absolute inset-0 flex items-end p-5 sm:p-6">
                          <div className="max-w-lg rounded-3xl border border-white/15 bg-black/30 p-4 text-white backdrop-blur-md">
                            <div className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">
                              {current.badge}
                            </div>
                            <h2 className="text-2xl font-black sm:text-3xl">{current.title}</h2>
                            <p className="mt-2 text-sm text-white/85">{current.subtitle}</p>
                            <Button
                              type="button"
                              className="mt-4 h-11 rounded-2xl bg-white text-brand-green hover:bg-brand-gray"
                              onClick={() => navigate(current.href)}
                            >
                              {current.cta}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={() => setActive((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)}
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-brand-charcoal shadow-lg transition-transform hover:scale-105"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActive((prev) => (prev + 1) % carouselSlides.length)}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-brand-charcoal shadow-lg transition-transform hover:scale-105"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                    {carouselSlides.map((slide, index) => (
                      <button
                        key={slide.title}
                        type="button"
                        onClick={() => setActive(index)}
                        className={cn(
                          'h-2.5 rounded-full transition-all',
                          active === index ? 'w-8 bg-white' : 'w-2.5 bg-white/50'
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-none">
              <div className="flex min-w-max gap-3 pb-1">
                {featureCards.map((card) => (
                  <motion.div
                    key={card.label}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="w-40 sm:w-48 rounded-2xl border border-green-100/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-brand-charcoal"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-premium-50 text-premium-700 dark:bg-white/5">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-brand-charcoal dark:text-white">{card.label}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{card.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
