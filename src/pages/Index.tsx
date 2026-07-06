import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { onValue, ref } from 'firebase/database';
import { database } from '@/lib/firebase';
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
import { ArrowRight, Flame, Package, Sparkles, Star, ShieldCheck, Truck } from 'lucide-react';
import { snapshotToArray } from '@/lib/rtdb';

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
  createdAt?: number;
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
    const productsRef = ref(database, 'products');
    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        try {
          const firebaseProducts = snapshotToArray<Record<string, unknown>>(snapshot.val())
            .map((product) => {
              const mainPrice = Number(product.mainPrice ?? product.price ?? 0);
              return {
                ...product,
                id: String(product.id),
                mainPrice,
                price: mainPrice,
                offerPrice: product.offerPrice ?? null,
                mainImageUrl:
                  (product.mainImageUrl as string) ||
                  (product.mainImage as string) ||
                  (product.imageUrl as string) ||
                  (product.image as string) ||
                  '',
                mainImage:
                  (product.mainImageUrl as string) ||
                  (product.mainImage as string) ||
                  (product.imageUrl as string) ||
                  (product.image as string) ||
                  '',
                inStock: product.inStock ?? true,
                rating: Number(product.rating ?? 4.5),
                createdAt: Number(product.createdAt ?? 0),
              } as Product;
            })
            .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
            .slice(0, 24);
          setProducts(firebaseProducts);
        } catch (error) {
          console.error('Error loading products:', error);
          setProducts([]);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error loading products:', error);
        setProducts([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const hotDeals = products.filter(
    (p) => p.offerPrice && p.mainPrice && p.offerPrice < p.mainPrice
  );
  const featuredProducts = products.filter((p) => p.featured);
  const trendingProducts = [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const newArrivals = [...products].sort(
    (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
  );

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

  const renderSection = (title: string, subtitle: string, icon: React.ElementType, items: Product[]) => (
    <section className="px-4 py-6 sm:py-8">
      <FadeInView>
        <div className="max-w-7xl mx-auto flex items-end justify-between mb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-premium-50 px-3 py-1 text-xs font-semibold text-premium-700 dark:bg-white/5 dark:text-white/80">
              {React.createElement(icon, { className: 'w-3.5 h-3.5' })}
              {title}
            </div>
            <h2 className="mt-2 text-2xl font-black text-brand-charcoal dark:text-white">{subtitle}</h2>
          </div>
          <Link to="/shop">
            <Button variant="ghost" className="text-brand-green font-semibold text-sm">
              সব দেখুন <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </FadeInView>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-7xl mx-auto">
        {items.slice(0, 8).map((product) => (
          <ProductCard
            key={`${title}-${product.id}`}
            product={product as never}
            handleAddToCart={handleAddToCart}
            handleDirectOrder={handleDirectOrder}
            onProductClick={handleProductClick}
          />
        ))}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-brand-gray dark:bg-brand-charcoal overflow-x-hidden">
      <HeroSection products={products} />
      <FlashSaleSection />

      <section className="px-4 py-6">
        <FadeInView>
          <div className="max-w-7xl mx-auto flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-brand-charcoal dark:text-white">
                নতুন পণ্য
              </h2>
              <p className="text-sm text-muted-foreground">আপনার জন্য তাজা কালেকশন</p>
            </div>
            <Link to="/shop">
              <Button variant="ghost" className="text-brand-green font-semibold text-sm">
                সব দেখুন <ArrowRight className="w-4 h-4 ml-1" />
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
              <Package className="w-12 h-12 text-brand-green mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">পণ্য আসছে শিগগিরই</h3>
              <p className="text-sm text-muted-foreground mb-4">
                নতুন নতুন পণ্য যোগ করা হচ্ছে। শীঘ্রই আবার চেক করুন!
              </p>
              <Link to="/shop">
                <Button className="bg-brand-green hover:bg-[#15803d] rounded-xl">দোকান দেখুন</Button>
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
        <section className="px-4 py-4 border-t border-green-100/50 dark:border-green-900/20">
          <FadeInView>
            <h2 className="text-lg font-bold text-brand-charcoal dark:text-white mb-4 max-w-7xl mx-auto">
              সম্প্রতি দেখা পণ্য
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
                        category: item.category || 'General',
                      } as Product);
                  }}
                  className="snap-start shrink-0 w-24 text-left"
                >
                  <img
                    src={item.mainImageUrl || '/placeholder.jpg'}
                    alt={item.name}
                    className="w-24 h-24 object-contain rounded-xl bg-white dark:bg-white/5 border border-green-100/50 p-1"
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

      {renderSection('বাছাইকৃত পণ্য', 'আমাদের সেরা নির্বাচন', Star, featuredProducts.length ? featuredProducts : displayProducts)}
      {renderSection('ট্রেন্ডিং পণ্য', 'এই মুহূর্তে ক্রেতাদের পছন্দ', Flame, trendingProducts)}
      {renderSection('নতুন এসেছে', 'দোকানে নতুন সংযোজন', Sparkles, newArrivals)}

      <section className="px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto overflow-hidden rounded-3xl bg-gradient-to-r from-premium-600 to-emerald-600 text-white p-6 shadow-xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">আমাদের প্রতিশ্রুতি</p>
              <h3 className="mt-2 text-2xl font-black sm:text-3xl">দ্রুত ডেলিভারিসহ প্রিমিয়াম কেনাকাটার অভিজ্ঞতা।</h3>
              <p className="mt-2 max-w-2xl text-sm text-white/85">
                ব্র্যান্ডের নিজস্ব পরিচয় রেখে হোমপেজকে আরও পরিষ্কার, আধুনিক আর প্রিমিয়াম লুক দিয়েছি।
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <Truck className="h-5 w-5" />
                <p className="mt-2 text-sm font-semibold">ফ্রি ডেলিভারি</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <ShieldCheck className="h-5 w-5" />
                <p className="mt-2 text-sm font-semibold">অফিশিয়াল ওয়ারেন্টি</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8">
        <FadeInView>
          <div className="max-w-3xl mx-auto glass-card p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">আপনার টেক আপগ্রেড করতে প্রস্তুত?</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              জেনুইন পণ্য · সারা বাংলাদেশে দ্রুত ডেলিভারি · কাস্টমার-ফ্রেন্ডলি পেমেন্ট
            </p>
            <Link to="/shop">
              <Button className="bg-brand-green hover:bg-[#15803d] text-white rounded-2xl px-8 h-11 font-semibold shadow-lg shadow-green-600/20">
                কেনাকাটা শুরু করুন <ArrowRight className="w-4 h-4 ml-2" />
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
