import React from 'react';
import { Sparkles } from 'lucide-react';
import FadeInView from './FadeInView';
import ProductCard from './ProductCard';

interface RecommendationsSectionProps {
  products: any[];
  title?: string;
  subtitle?: string;
  handleAddToCart: (p: any) => void;
  handleDirectOrder: (p: any) => void;
  onProductClick?: (p: any) => void;
}

const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  products,
  title = 'আপনার জন্য বাছাই',
  subtitle = 'ট্রেন্ডিং টেকের উপর ভিত্তি করে বিশেষ নির্বাচন',
  handleAddToCart,
  handleDirectOrder,
  onProductClick,
}) => {
  if (!products.length) return null;

  const picks = products.slice(0, 4);

  return (
    <section className="px-4 py-8">
      <FadeInView>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-brand-green" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green">স্মার্ট বাছাই</span>
          </div>
          <h2 className="text-xl font-bold text-brand-charcoal dark:text-white">{title}</h2>
          <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {picks.map((product, i) => (
              <div key={product.id} style={{ animationDelay: `${i * 0.05}s` }}>
                <ProductCard
                  product={product}
                  handleAddToCart={handleAddToCart}
                  handleDirectOrder={handleDirectOrder}
                  onProductClick={onProductClick}
                />
              </div>
            ))}
          </div>
        </div>
      </FadeInView>
    </section>
  );
};

export default RecommendationsSection;
