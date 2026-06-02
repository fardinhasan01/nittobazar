import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Smartphone,
  Laptop,
  Watch,
  Gamepad2,
  Headphones,
  Cable,
} from 'lucide-react';
import FadeInView from './FadeInView';

const categories = [
  { name: 'Smartphones', icon: Smartphone, slug: 'Smartphones' },
  { name: 'Laptops', icon: Laptop, slug: 'Laptops' },
  { name: 'Smart Watches', icon: Watch, slug: 'Smartwatches' },
  { name: 'Gaming', icon: Gamepad2, slug: 'Gaming Accessories' },
  { name: 'Audio', icon: Headphones, slug: 'Headphones' },
  { name: 'Accessories', icon: Cable, slug: 'Phone Accessories' },
];

const CategorySection = () => (
  <section className="py-8 px-4 bg-brand-gray dark:bg-brand-charcoal/30">
    <FadeInView>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-lg font-bold text-brand-charcoal dark:text-white mb-1">Shop by Category</h2>
        <p className="text-sm text-muted-foreground mb-6">Find your perfect gadget</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
              >
                <Link
                  to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white dark:bg-brand-charcoal shadow-md border border-orange-100 dark:border-orange-900/40 flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:scale-105 group-hover:border-brand-orange/50">
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-brand-orange transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-center text-brand-charcoal dark:text-gray-200 line-clamp-2">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </FadeInView>
  </section>
);

export default CategorySection;
