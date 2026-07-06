import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Zap, Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';

interface Product {
  id: string | number;
  name: string;
  price?: number;
  originalPrice?: number;
  mainPrice?: number;
  offerPrice?: number;
  discount?: number;
  category: string;
  stock: number;
  image?: string;
  mainImage?: string;
  imageUrl?: string;
  mainImageUrl?: string;
  description?: string;
  inStock: boolean;
  featured?: boolean;
  rating: number;
  tags?: string[];
}

interface ProductCardProps {
  product: Product;
  handleAddToCart: (product: Product) => void;
  handleDirectOrder: (product: Product) => void;
  onProductClick?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  handleAddToCart,
  handleDirectOrder,
  onProductClick,
}) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const mainPrice = product.price || product.mainPrice || 0;
  const originalPrice = product.originalPrice || mainPrice;
  const offerPrice =
    product.offerPrice ||
    (product.originalPrice && product.price && product.price < product.originalPrice
      ? product.price
      : null);
  const hasDiscount =
    typeof offerPrice === 'number' && offerPrice > 0 && offerPrice < originalPrice;
  const priceToShow = hasDiscount ? offerPrice : mainPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
    : 0;

  const imageSrc =
    product.mainImageUrl ||
    (Array.isArray(product.image) ? product.image[0] : product.image) ||
    '/placeholder.jpg';

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    onProductClick?.(product);
  };

  const wishlisted = isInWishlist(String(product.id));

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Card
        className="group relative h-full overflow-hidden bg-white dark:bg-brand-charcoal border border-green-100/80 dark:border-green-900/30 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-green-600/10 transition-shadow duration-300 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative overflow-hidden bg-brand-gray dark:bg-white/5 rounded-t-2xl aspect-square">
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-110 gpu-accelerate"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.jpg';
              target.onerror = null;
            }}
          />
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-brand-green text-white text-[10px] font-bold px-2 py-1 rounded-lg">
              -{discountPercentage}%
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist({
                id: String(product.id),
                name: product.name,
                mainImageUrl: imageSrc,
                price: mainPrice,
                offerPrice: offerPrice ?? null,
              });
            }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-brand-charcoal/90 shadow flex items-center justify-center transition-transform duration-200 hover:scale-110"
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`w-4 h-4 ${wishlisted ? 'fill-brand-green text-brand-green' : 'text-gray-400'}`}
            />
          </button>
          <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-white/90 dark:bg-brand-charcoal/90 rounded-lg px-2 py-0.5 text-xs font-semibold shadow-sm">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            {product.rating ?? 4.5}
          </div>
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-lg">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <CardContent className="p-3 space-y-2">
          <h3 className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] text-brand-charcoal dark:text-white group-hover:text-brand-green transition-colors">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-brand-green">৳{priceToShow.toLocaleString()}</span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                ৳{originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleDirectOrder(product);
              }}
              disabled={!product.inStock}
              className="flex-1 h-9 bg-brand-green hover:bg-[#15803d] text-white text-xs font-semibold rounded-xl transition-all duration-300"
            >
              <Zap className="w-3 h-3 mr-1" />
              Buy
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(product);
              }}
              disabled={!product.inStock}
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl border-brand-green/40 text-brand-green hover:bg-green-50 dark:hover:bg-green-950/30"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProductCard;
