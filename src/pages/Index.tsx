import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useNavigate } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import ProductDetailModal from '@/components/ProductDetailModal';
import HeroSection from '@/components/HeroSection';
import FlashSaleSection from '@/components/FlashSaleSection';
import RecommendationsSection from '@/components/RecommendationsSection';
import Footer from '@/components/Footer';
import FadeInView from '@/components/FadeInView';
import { Button } from '@/components/ui/button';
import { ArrowRight, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  stock: number;
  image: string;
  mainImageUrl?: string;
  description?: string;
  inStock: boolean;
  featured?: boolean;
  rating: number;
  mainImage: string;
  mainPrice: number;
  createdAt?: { seconds: number };
  tags?: string[];
  offerPrice?: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const { recent, addRecent } = useRecentlyViewed();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('createdAt', 'desc'), limit(24));
        const querySnapshot = await getDocs(q);
        const firebaseProducts = querySnapshot.docs.map((doc) => {
          const data = doc.data() as Record<string, unknown>;
          const mainPrice = Number(data.mainPrice ?? data.price ?? 0);
          return {
            id: doc.id,
            ...data,
            mainPrice,
            price: mainPrice,
            offerPrice: data.offerPrice ?? null,
            mainImageUrl:
              (data.mainImageUrl as string) ||
              (data.mainImage as string) ||
              (data.imageUrl as string) ||
              (data.image as string) ||
              '',
            mainImage:
              (data.mainImageUrl as string) ||
              (data.mainImage as string) ||
              (data.imageUrl as string) ||
              (data.image as string) ||
              '',
            inStock: data.inStock ?? true,
            rating: (data.rating as number) ?? 4.5,
          } as Product;
        });
        setProducts(firebaseProducts);
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const hotDeals = products.filter(
    (p) => p.offerPrice && p.mainPrice && p.offerPrice < p.mainPrice
  );
  const featuredProducts = products.filter((p) => p.featured);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      mainImageUrl:
        product.mainImageUrl || product.mainImage || product.image || '',
      mainImage:
        product.mainImageUrl || product.mainImage || product.image || '',
      price: product.price ?? product.mainPrice,
      offerPrice: product.offerPrice,
      quantity: 1,
    });
    toast({ title: 'Added to cart' });
  };

  const handleDirectOrder = (product: Product) => {
    navigate('/checkout', {
      state: {
        buyNowItem: {
          id: product.id,
          name: product.name,
          price: product.price,
          offerPrice: product.offerPrice,
          quantity: 1,
          mainImageUrl:
            product.mainImageUrl || product.mainImage || product.image,
          imageUrl:
            product.mainImageUrl || product.mainImage || product.image,
        },
      },
    });
  };

  const handleProductClick = (product: Product) => {
    addRecent({
      id: product.id,
      name: product.name,
      mainImageUrl: product.mainImageUrl || product.mainImage,
      price: product.price ?? product.mainPrice,
      offerPrice: product.offerPrice,
      category: product.category,
      rating: product.rating,
    });
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  };

  const displayProducts = hotDeals.length > 0 ? hotDeals : products;

  return (
    <div className="min-h-screen bg-brand-gray dark:bg-brand-charcoal overflow-x-hidden">
      <HeroSection />
      <FlashSaleSection />

      <section className="px-4 py-6">
        <FadeInView>
          <div className="max-w-7xl mx-auto flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-brand-charcoal dark:text-white">
                Latest Products
              </h2>
              <p className="text-sm text-muted-foreground">Fresh arrivals for you</p>
            </div>
            <Link to="/shop">
              <Button variant="ghost" className="text-brand-orange font-semibold text-sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </FadeInView>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-7xl mx-auto">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square rounded-2xl skeleton-shimmer" />
                <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                <div className="h-8 w-1/2 rounded skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <FadeInView>
            <div className="max-w-md mx-auto text-center py-16 glass-card p-8">
              <Package className="w-12 h-12 text-brand-orange mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Products Coming Soon</h3>
              <p className="text-sm text-muted-foreground mb-4">
                New premium gadgets are being added. Check back shortly!
              </p>
              <Link to="/shop">
                <Button className="bg-brand-orange hover:bg-[#e55f00] rounded-xl">Browse Shop</Button>
              </Link>
            </div>
          </FadeInView>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-7xl mx-auto">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product as never}
                handleAddToCart={handleAddToCart}
                handleDirectOrder={handleDirectOrder}
                onProductClick={handleProductClick}
              />
            ))}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section className="px-4 py-4 border-t border-orange-100/50 dark:border-orange-900/20">
          <FadeInView>
            <h2 className="text-lg font-bold text-brand-charcoal dark:text-white mb-4 max-w-7xl mx-auto">
              Recently Viewed
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 max-w-7xl mx-auto scrollbar-hide snap-x">
              {recent.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    const match = products.find((p) => p.id === item.id);
                    if (match) handleProductClick(match);
                    else
                      handleProductClick({
                        ...item,
                        stock: 1,
                        image: item.mainImageUrl || '',
                        mainImage: item.mainImageUrl,
                        inStock: true,
                        category: item.category || 'Gadgets',
                      } as Product);
                  }}
                  className="snap-start shrink-0 w-24 text-left"
                >
                  <img
                    src={item.mainImageUrl || '/placeholder.jpg'}
                    alt={item.name}
                    className="w-24 h-24 object-contain rounded-xl bg-white dark:bg-white/5 border border-orange-100/50 p-1"
                    loading="lazy"
                  />
                  <p className="text-xs mt-1 line-clamp-2 font-medium">{item.name}</p>
                </button>
              ))}
            </div>
          </FadeInView>
        </section>
      )}

      <RecommendationsSection
        products={featuredProducts.length ? featuredProducts : displayProducts}
        handleAddToCart={handleAddToCart}
        handleDirectOrder={handleDirectOrder}
        onProductClick={handleProductClick}
      />

      <section className="px-4 py-8">
        <FadeInView>
          <div className="max-w-3xl mx-auto glass-card p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Ready to upgrade your tech?</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Genuine products · Fast delivery across Bangladesh · Pay on delivery
            </p>
            <Link to="/shop">
              <Button className="bg-brand-orange hover:bg-[#e55f00] text-white rounded-2xl px-8 h-11 font-semibold shadow-lg shadow-orange-500/20">
                Start Shopping <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </FadeInView>
      </section>

      <Footer />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={handleCloseProductModal}
        handleAddToCart={handleAddToCart}
        handleDirectOrder={handleDirectOrder}
      />
    </div>
  );
};

export default Index;
