import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HeroSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-brand-orange via-[#ff8534] to-[#ff9a4d] text-white">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-black/10 blur-3xl" />
      <motion.div
        className="absolute top-1/4 right-4 w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg hidden sm:flex items-center justify-center"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Zap className="w-6 h-6 text-white/90" />
      </motion.div>
      <motion.div
        className="absolute bottom-1/4 left-3 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/15 hidden sm:block"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
    </div>

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-5 md:py-8 flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md text-center"
      >
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-semibold mb-2 border border-white/25">
          <Sparkles className="w-3 h-3" />
          Premium Tech Store
        </span>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold leading-snug tracking-tight">
          সেরা পণ্য , সেরা দামে !
          <br />
          <span className="text-base sm:text-lg md:text-xl font-semibold opacity-95">
            AB Gadgets এ
          </span>
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-white/90 mx-auto max-w-xs">
          Premium Gadgets Delivered Across Bangladesh.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Link to="/shop">
            <Button className="bg-white text-brand-orange hover:bg-brand-gray font-semibold rounded-xl px-4 h-8 text-xs shadow-md transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
              Shop Now
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
          <Link to="/shop">
            <Button
              variant="outline"
              className="border-2 border-white/80 text-white bg-transparent hover:bg-white/15 rounded-xl px-4 h-8 text-xs font-semibold transition-all duration-300"
            >
              Explore Deals
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>

    <div className="h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
  </section>
);

export default HeroSection;
