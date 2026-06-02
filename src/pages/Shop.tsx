import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, List, ArrowRight, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import ProductCard from '@/components/ProductCard';
import ProductDetailModal from '@/components/ProductDetailModal';
import { Skeleton } from '@/components/ui/skeleton';
import { products as localProducts } from '@/data/products';

const Shop = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'All'
  );
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      try {
        const firebaseProducts = snapshot.docs.map((doc) => {
          const data: any = doc.data();
          return {
            id: doc.id,
            name: data.name,
            price: data.mainPrice ?? data.price ?? 0,
            originalPrice: data.originalPrice ?? undefined,
            mainPrice: data.mainPrice ?? data.price ?? 0,
            offerPrice: data.offerPrice ?? null,
            discount: data.discount ?? undefined,
            category: data.category ?? 'Misc',
            stock: data.stock ?? 0,
            image: data.image,
            mainImage: data.mainImage,
            imageUrl: data.imageUrl,
            mainImageUrl: data.mainImageUrl ?? data.mainImage ?? data.image ?? data.imageUrl,
            description: data.description ?? '',
            inStock: data.inStock ?? true,
            featured: data.featured ?? false,
            rating: data.rating ?? 4.5,
            tags: data.tags ?? [],
          };
        });

        // Merge with local products (fallback), prefer Firebase by name
        const allProducts = [...localProducts, ...firebaseProducts];
        const uniqueProducts = allProducts.filter((product, index, self) =>
          index === self.findIndex((p: any) => p.name === product.name)
        );

        setProducts(uniqueProducts);
        setFilteredProducts(uniqueProducts);

        const uniqueCategories = ['All', ...new Set(uniqueProducts.map((p: any) => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error mapping products:', error);
        setProducts(localProducts as any);
        setFilteredProducts(localProducts as any);
        const uniqueCategories = ['All', ...new Set(localProducts.map((p: any) => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
        toast({ title: 'Warning', description: 'Using local products due to connection issues.', variant: 'default' });
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error('Error fetching products:', err);
      setProducts(localProducts as any);
      setFilteredProducts(localProducts as any);
      const uniqueCategories = ['All', ...new Set(localProducts.map((p: any) => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
      setLoading(false);
      toast({ title: 'Warning', description: 'Using local products due to connection issues.', variant: 'default' });
    });

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    let tempProducts = [...products];

    if (selectedCategory !== 'All') {
      tempProducts = tempProducts.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      tempProducts = tempProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(tempProducts);
  }, [searchTerm, selectedCategory, products]);

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price ?? product.mainPrice,
      offerPrice: product.offerPrice,
      quantity: 1,
      mainImageUrl: product.mainImageUrl,
    });
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleDirectOrder = (product: any) => {
    const imageUrl =
      product.mainImageUrl || product.mainImage || product.imageUrl || product.image;
    navigate('/checkout', {
      state: {
        buyNowItem: {
          id: product.id,
          name: product.name,
          price: product.price ?? product.mainPrice,
          offerPrice: product.offerPrice,
          quantity: 1,
          mainImageUrl: imageUrl,
          mainImage: imageUrl,
          imageUrl,
        },
      },
    });
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchTerm(q);
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-brand-gray dark:bg-brand-charcoal pb-8">
      <div className="bg-gradient-to-r from-brand-orange/10 to-transparent pt-4 pb-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl md:text-3xl font-black text-orange-700 mb-1 drop-shadow-sm">
            সব পণ্য
          </h1>
          <p className="text-orange-800 text-xs md:text-sm font-semibold max-w-2xl mx-auto mb-3">
            আমাদের সেরা সকল পণ্য এখনই দেখুন
          </p>
          <Button 
            onClick={() => navigate('/categories')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-lg"
          >
            <List className="w-3 h-3 mr-1" />
            ক্যাটাগরি দেখুন
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 z-10 relative">
        {/* Search and Filter */}
        <Card className="bg-white/90 backdrop-blur-sm border-orange-200 rounded-2xl shadow-xl mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="পণ্য খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
                {searchTerm && (
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchTerm('')}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(category)}
                    className={`whitespace-nowrap ${selectedCategory === category ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'border-orange-200 text-orange-700 hover:bg-orange-50'}`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-56 w-full rounded-2xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                handleAddToCart={handleAddToCart}
                handleDirectOrder={handleDirectOrder}
                onProductClick={handleProductClick}
              />
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20 col-span-full">
            <h2 className="text-2xl font-bold text-orange-800">কোন পণ্য পাওয়া যায়নি</h2>
            <p className="text-orange-700 mt-2">আপনার খোঁজ বা ফিল্টার পরিবর্তন করুন।</p>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
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

export default Shop;
