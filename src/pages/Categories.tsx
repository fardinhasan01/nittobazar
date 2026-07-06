// File: pages/categories.tsx

import React, { useEffect, useState } from "react";
import { get, onValue, ref, set, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import { Input } from "@/components/ui/input";
import { Search, Filter, Sparkles, Grid, List, ArrowRight, Eye } from "lucide-react";
import { getProductImage } from "@/lib/utils";
import { snapshotToArray } from "@/lib/rtdb";

// Updated Product interface to match the rest of the app
interface Product {
  id: string;
  name: string;
  price?: number;
  originalPrice?: number;
  mainPrice: number;
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

const CategoriesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribeProducts = onValue(ref(database, 'products'), (snapshot) => {
      try {
        const firebaseProducts = snapshotToArray<any>(snapshot.val()).map((product) => ({
          id: String(product.id),
          name: String(product.name || ''),
          price: Number(product.mainPrice ?? product.price ?? 0),
          originalPrice: product.originalPrice ?? undefined,
          mainPrice: Number(product.mainPrice ?? product.price ?? 0),
          offerPrice: product.offerPrice ?? undefined,
          discount: product.discount ?? undefined,
          category: String(product.category || 'Misc'),
          stock: Number(product.stock ?? 0),
          image: product.image,
          mainImage: product.mainImage,
          imageUrl: product.imageUrl,
          mainImageUrl: product.mainImageUrl ?? product.mainImage ?? product.image ?? product.imageUrl,
          description: product.description ?? '',
          inStock: product.inStock ?? true,
          featured: product.featured ?? false,
          rating: Number(product.rating ?? 4.5),
          tags: Array.isArray(product.tags) ? product.tags : [],
        })) as Product[];

        setProducts(firebaseProducts);
        setCategories(['All', ...Array.from(new Set(firebaseProducts.map((p) => p.category).filter(Boolean)))]);
      } catch (error) {
        console.error("Error fetching data: ", error);
        setProducts([]);
        setCategories(['All']);
        toast({ title: 'Warning', description: 'Unable to load products from Realtime Database.', variant: 'default' });
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error fetching products:', error);
      setProducts([]);
      setCategories(['All']);
      setLoading(false);
    });

    const unsubscribeCategories = onValue(ref(database, 'categories'), (snapshot) => {
      const value = snapshot.val();
      const categoryNames = Array.isArray(value)
        ? value.map((item) => (typeof item === 'string' ? item : String((item as any)?.name || (item as any)?.label || '')))
        : value && typeof value === 'object'
          ? Object.values(value as Record<string, any>).map((item) => (typeof item === 'string' ? item : String(item?.name || item?.label || '')))
          : [];
      if (categoryNames.length > 0) {
        setCategories(['All', ...categoryNames.filter(Boolean)]);
      }
    });

    void updateViewerCount();

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, [toast]);

  const updateViewerCount = async () => {
    try {
      const viewerRef = ref(database, 'settings/visitorCount');
      const snap = await get(viewerRef);
      const currentCount = Number((snap.val() as { count?: number } | null)?.count || 0);
      if (!snap.exists()) {
        await set(viewerRef, { count: 1 });
        setViewerCount(1);
      } else {
        await update(viewerRef, { count: currentCount + 1 });
        setViewerCount(currentCount + 1);
      }
    } catch (error) {
      console.error('Error updating viewer count:', error);
      // Fallback: set a default count
      setViewerCount(1);
    }
  };
  
  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      offerPrice: product.offerPrice,
      quantity: 1,
      mainImageUrl: product.mainImageUrl,
    });
    toast({ title: '✅ Product added to cart successfully!' });
  };

  const handleDirectOrder = (product: Product) => {
    navigate('/checkout', { state: { buyNowItem: {
      id: product.id,
      name: product.name,
      price: product.price,
      offerPrice: product.offerPrice,
      quantity: 1,
      mainImageUrl: product.mainImageUrl,
    }}});
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  };

  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === 'All' || product.category === selectedCategory;
    const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-yellow-50 to-white animate-pulse-slow"></div>
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 z-10">
        {/* Categories List - Compact */}
        <div className="mb-4 animate-slide-up">
          <h2 className="text-xl font-bold text-green-900 mb-2">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 text-sm ${
                  selectedCategory === category
                    ? 'bg-green-700 text-white shadow-lg'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Filters (compact) */}
        <div className="mb-4 p-3 bg-white rounded-2xl shadow-xl border border-green-200/50 animate-slide-up">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5 group-focus-within:text-green-700 transition-colors duration-300" />
              <Input
                type="text"
                placeholder="Search products in this category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 w-full bg-green-50 border-green-200 text-green-900 placeholder-green-600/60 focus:border-green-400 focus:ring-green-400/20 rounded-xl h-11 text-base transition-all duration-300 hover:bg-green-100 focus:bg-white"
              />
            </div>
            
            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-12 pr-8 py-2.5 bg-green-50 border border-green-200 rounded-xl text-green-900 focus:border-green-400 focus:ring-green-400/20 h-11 text-base font-medium appearance-none cursor-pointer transition-all duration-300 hover:bg-green-100 focus:bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="text-green-900">{cat}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  viewMode === 'grid' 
                    ? 'bg-green-700 text-white shadow-lg' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  viewMode === 'list' 
                    ? 'bg-green-700 text-white shadow-lg' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Enhanced Shop All Button */}
            <div className="flex items-center">
              <button
                onClick={() => navigate('/shop')}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-md group flex items-center text-sm"
              >
                <Sparkles className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Shop All
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-green-800 text-lg font-medium">Loading premium products...</p>
            </div>
          </div>
        ) : (
          <div className={`animate-fade-in ${
            viewMode === 'grid' 
              ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6' 
              : 'space-y-6'
          }`}>
            {filteredProducts.map((product, index) => (
              <div 
                key={product.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProductCard
                  product={product}
                  handleAddToCart={handleAddToCart}
                  handleDirectOrder={handleDirectOrder}
                  onProductClick={handleProductClick}
                />
              </div>
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">No products found</h3>
            <p className="text-green-700 text-lg">Try adjusting your search or category filter.</p>
          </div>
        )}

        {/* Viewer Counter */}
        <div className="mt-12 mb-8 flex justify-center">
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-pulse-slow">
            <Eye className="w-5 h-5" />
            <span className="font-semibold text-sm">
              {viewerCount > 0 ? `${viewerCount.toLocaleString()} visitors` : '1,234 visitors'}
            </span>
          </div>
        </div>
      </main>

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

export default CategoriesPage;
