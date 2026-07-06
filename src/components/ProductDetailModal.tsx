import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, X, Send, User, Calendar, Crown, Sparkles } from 'lucide-react';
import { getProductImageUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  reviewerName: string;
  reviewText: string;
  rating: number;
  date: string;
}

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

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  handleAddToCart: (product: Product) => void;
  handleDirectOrder: (product: Product) => void;
}

// Mock reviews data with Bengali names and text
const generateMockReviews = (productId: string | number): Review[] => {
  const bengaliNames = [
    'মিথিলা আক্তার', 'সুমন হোসেন', 'মাহমুদ রহমান', 'তানজিলা নূর', 
    'রফিক আহমেদ', 'ফাতেমা খাতুন', 'আব্দুল্লাহ আল মামুন', 'সাবরিনা ইয়াসমিন',
    'ইমরান হোসেন', 'নাজমা আক্তার', 'শাহরিয়ার আহমেদ', 'রেহানা সুলতানা',
    'আদনান হোসেন', 'জারিনা আক্তার', 'মাহবুবুর রহমান', 'সাবরিনা আক্তার'
  ];

  const bengaliReviews = [
    'পণ্যটি খুব ভালো মানের। দামের তুলনায় অনেক ভালো।',
    'অনেক দিন ধরে ব্যবহার করছি, কোন সমস্যা নেই।',
    'ডেলিভারি খুব দ্রুত হয়েছে। পণ্যটি ঠিক সময়ে পেয়েছি।',
    'কোয়ালিটি অনেক ভালো। সত্যিই সন্তুষ্ট।',
    'পণ্যটি দেখতে অনেক সুন্দর। ব্যবহার করতেও ভালো লাগছে।',
    'অনেক দিনের ইচ্ছা ছিল এই পণ্যটি কিনব। এখন কিনে খুব খুশি।',
    'সেবা অনেক ভালো। পণ্যটিও ঠিক আছে।',
    'দামের তুলনায় অনেক ভালো পণ্য। রেকমেন্ড করব।',
    'পণ্যটি অনেক দ্রুত কাজ করে। সত্যিই ভালো লাগছে।',
    'অনেক দিন ধরে খুঁজছিলাম এমন পণ্য। এখন পেয়ে খুব খুশি।',
    'কোয়ালিটি অনেক ভালো। দামও যুক্তিসঙ্গত।',
    'পণ্যটি ব্যবহার করে অনেক সন্তুষ্ট। আবার কিনব।',
    'ডেলিভারি সেবা অনেক ভালো। পণ্যটিও ঠিক আছে।',
    'অনেক দিনের অভিজ্ঞতা। এই পণ্যটি সত্যিই ভালো।',
    'পণ্যটি দেখতে অনেক সুন্দর। ব্যবহার করতেও ভালো।',
    'সেবা অনেক ভালো। পণ্যটিও ঠিক আছে।'
  ];

  const reviewCount = Math.floor(Math.random() * 200) + 200; // Random between 200-400
  const reviews: Review[] = [];

  for (let i = 0; i < reviewCount; i++) {
    const randomName = bengaliNames[Math.floor(Math.random() * bengaliNames.length)];
    const randomReview = bengaliReviews[Math.floor(Math.random() * bengaliReviews.length)];
    const randomRating = Math.random() > 0.1 ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 2) + 3; // Mostly 4-5 stars
    const randomDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);

    reviews.push({
      id: `${productId}-review-${i}`,
      reviewerName: randomName,
      reviewText: randomReview,
      rating: randomRating,
      date: randomDate.toISOString()
    });
  }

  return reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  handleAddToCart,
  handleDirectOrder
}) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({
    name: '',
    reviewText: '',
    rating: 5
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (product && isOpen) {
      // Generate mock reviews for the product
      const mockReviews = generateMockReviews(product.id);
      setReviews(mockReviews);
      setCurrentImageIndex(0);
    }
  }, [product, isOpen]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReview.name.trim() || !newReview.reviewText.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmittingReview(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const review: Review = {
        id: `${product?.id}-review-${Date.now()}`,
        reviewerName: newReview.name,
        reviewText: newReview.reviewText,
        rating: newReview.rating,
        date: new Date().toISOString()
      };

      setReviews(prev => [review, ...prev]);
      setNewReview({ name: '', reviewText: '', rating: 5 });
      
      toast({
        title: 'Review Submitted',
        description: 'Thank you for your review!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  // Fixed price logic - handle both data structures properly
  const mainPrice = product?.price || product?.mainPrice || 0;
  const originalPrice = product?.originalPrice || mainPrice;
  const offerPrice = product?.offerPrice || (product?.discount ? mainPrice : null);
  
  // Safe price logic with proper validation
  const hasDiscount = product && typeof offerPrice === 'number' && offerPrice > 0 && offerPrice < originalPrice;
  const priceToShow = hasDiscount ? offerPrice : mainPrice;
  const discountPercentage = hasDiscount ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100) : 0;

  // Helper for bengali numbers
  const toBengaliNumber = (num: number) => {
    const bengaliNumbers = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(num).split('').map(digit => bengaliNumbers[parseInt(digit, 10)]).join('');
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${star <= rating ? 'text-gold-500 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 pb-24 md:pb-6 bg-white dark:bg-brand-charcoal border-green-100 dark:border-green-900/30">
        <div className="p-6 overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {product.featured && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  <Crown className="w-4 h-4" />
                  Premium
                </div>
              )}
              <span className="text-xl font-bold text-brand-charcoal dark:text-white">{product.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-premium-100"
            >
              <X className="h-4 w-4 text-premium-700" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-brand-gray dark:bg-white/5 rounded-2xl overflow-hidden border border-green-100 dark:border-green-900/30 shadow-lg">
              <img
                src={
                  product.mainImageUrl ||
                  (Array.isArray(product.image) ? product.image[0] : product.image) ||
                  "/placeholder.jpg"
                }
                alt={product.name}
                className="w-full h-full object-contain rounded-xl"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.jpg';
                  target.onerror = null;
                }}
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-premium-900 mb-2">{product.name}</h2>
              <div className="flex items-center gap-4 mb-4">
                {renderStars(averageRating, 'lg')}
                <span className="text-premium-600 font-semibold">{averageRating.toFixed(1)}</span>
                <span className="text-gray-500">({reviews.length} reviews)</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-baseline gap-3">
                {hasDiscount ? (
                  <>
                    <span className="text-3xl font-extrabold text-premium-600">
                      ৳{toBengaliNumber(priceToShow)}
                    </span>
                    <span className="text-xl text-gray-400 line-through">
                      ৳{toBengaliNumber(originalPrice)}
                    </span>
                    <span className="bg-premium-100 text-premium-600 px-3 py-1 rounded-full text-sm font-semibold border border-premium-200">
                      {toBengaliNumber(discountPercentage)}% ছাড়
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-extrabold text-premium-600">
                    ৳{toBengaliNumber(originalPrice)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-premium-600 bg-premium-100 px-3 py-1 rounded-full border border-premium-200">
                  {product.category}
                </span>
                <span className={`text-sm font-medium px-3 py-1 rounded-full border ${
                  product.inStock 
                    ? 'text-emerald-600 bg-emerald-100 border-emerald-200' 
                    : 'text-red-600 bg-red-100 border-red-200'
                }`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              {product.description && (
                <div>
                  <h3 className="font-semibold text-premium-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </div>
              )}
            </div>

            {/* Desktop action buttons */}
            <div className="hidden md:flex flex-col gap-3">
              <Button
                onClick={() => handleDirectOrder(product)}
                disabled={!product.inStock}
                className="w-full bg-brand-green hover:bg-[#15803d] text-white font-semibold rounded-xl h-11"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Buy Now
              </Button>
              <Button
                onClick={() => handleAddToCart(product)}
                disabled={!product.inStock}
                variant="outline"
                className="w-full border-brand-green/40 text-brand-green rounded-xl h-11"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 border-t border-premium-200 pt-8">
          <h3 className="text-2xl font-bold text-premium-900 mb-6">Customer Reviews</h3>
          
          {/* Review Summary */}
          <div className="bg-gradient-to-r from-premium-50 to-emerald-50 rounded-xl p-6 mb-8 border border-premium-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {renderStars(averageRating, 'lg')}
                <div>
                  <div className="text-2xl font-bold text-premium-900">{averageRating.toFixed(1)}</div>
                  <div className="text-premium-600">out of 5</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-premium-900">{reviews.length}</div>
                <div className="text-premium-600">total reviews</div>
              </div>
            </div>
          </div>

          {/* Add Review Form */}
          <div className="bg-white border border-premium-200 rounded-xl p-6 mb-8 shadow-lg">
            <h4 className="text-lg font-semibold text-premium-900 mb-4">Write a Review</h4>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <Label htmlFor="reviewName" className="text-premium-700">Your Name</Label>
                <Input
                  id="reviewName"
                  value={newReview.name}
                  onChange={(e) => setNewReview(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="আপনার নাম লিখুন"
                  className="border-premium-200 focus:border-premium-400 focus:ring-premium-200"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="reviewRating" className="text-premium-700">Rating</Label>
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                      className="focus:outline-none hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= newReview.rating ? 'text-gold-500 fill-current' : 'text-gray-300'} hover:text-gold-400 transition-colors`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="reviewText" className="text-premium-700">Your Review</Label>
                <Textarea
                  id="reviewText"
                  value={newReview.reviewText}
                  onChange={(e) => setNewReview(prev => ({ ...prev, reviewText: e.target.value }))}
                  placeholder="আপনার অভিজ্ঞতা শেয়ার করুন..."
                  className="border-premium-200 focus:border-premium-400 focus:ring-premium-200 min-h-[100px]"
                  required
                />
              </div>
              
              <Button
                type="submit"
                disabled={isSubmittingReview}
                className="bg-premium-600 hover:bg-premium-700 text-white border-0"
              >
                {isSubmittingReview ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="w-4 h-4 mr-2" />
                    Submit Review
                  </div>
                )}
              </Button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {reviews.slice(0, 10).map((review) => (
              <div key={review.id} className="bg-white border border-premium-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-premium-100 to-emerald-100 rounded-full flex items-center justify-center border border-premium-200">
                      <User className="w-5 h-5 text-premium-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-premium-900">{review.reviewerName}</div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating, 'sm')}
                        <span className="text-sm text-gray-500">
                          {new Date(review.date).toLocaleDateString('bn-BD')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{review.reviewText}</p>
              </div>
            ))}
          </div>
        </div>
        </div>

        {/* Sticky mobile buy bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] glass-nav border-t p-3 flex items-center gap-3 safe-bottom">
          <div className="shrink-0">
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="text-lg font-bold text-brand-green">
              ৳{toBengaliNumber(priceToShow)}
            </p>
          </div>
          <Button
            onClick={() => handleDirectOrder(product)}
            disabled={!product.inStock}
            className="flex-1 bg-brand-green hover:bg-[#15803d] text-white font-semibold rounded-xl h-11"
          >
            Buy Now
          </Button>
          <Button
            onClick={() => handleAddToCart(product)}
            disabled={!product.inStock}
            variant="outline"
            className="flex-1 border-brand-green text-brand-green rounded-xl h-11"
          >
            Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal; 