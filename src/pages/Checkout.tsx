import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin, User, Mail, Phone, Truck, AlertCircle, CheckCircle2, CreditCard, Wallet, Shield, Plus, Minus } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import {
  getPrice,
  hasValidDiscount,
  getProductImage,
  getDisplayImageUrl,
  normalizeCartItem,
  imageUrlFromFirestoreProduct,
  PLACEHOLDER_IMAGE,
} from '@/lib/utils';

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const termsRef = React.useRef<HTMLInputElement | null>(null);
  const [showTermsWarning, setShowTermsWarning] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    deliveryArea: '',
    paymentMethod: 'cod',
    bkashNumber: ''
  });
  const { cart, clearCart } = useCart();
  const [cartItems, setCartItems] = useState([]);
  const [deliveryLocation, setDeliveryLocation] = useState('dhaka');

  const toBn = (num: number) => {
    const map: Record<string, string> = { '0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯' };
    return String(num).replace(/[0-9]/g, d => map[d]);
  };

  useEffect(() => {
    let cancelled = false;

    const loadCheckoutItems = async () => {
      const sourceItems = location.state?.buyNowItem
        ? [location.state.buyNowItem]
        : cart?.length > 0
          ? cart
          : [];

      if (sourceItems.length === 0) {
        setCartItems([]);
        return;
      }

      if (location.state?.buyNowItem) {
        toast({
          title: 'Order Initiated!',
          description: 'Please confirm your details to complete the order.',
          variant: 'default',
        });
      }

      const hydrated = await Promise.all(
        sourceItems.map(async (item) => {
          const normalized = normalizeCartItem(item);

          if (!item?.id) {
            return normalized;
          }

          try {
            const snap = await getDoc(doc(db, 'products', String(item.id)));
            if (snap.exists()) {
              const imageUrl = imageUrlFromFirestoreProduct(snap.data());
              if (imageUrl !== PLACEHOLDER_IMAGE) {
                return normalizeCartItem({
                  ...normalized,
                  mainImageUrl: imageUrl,
                  mainImage: imageUrl,
                  imageUrl,
                });
              }
            }
          } catch (err) {
            console.error('Failed to load product image:', item.id, err);
          }

          return normalized;
        })
      );

      if (!cancelled) {
        setCartItems(hydrated);
      }
    };

    loadCheckoutItems();
    return () => {
      cancelled = true;
    };
  }, [cart, location.state, toast]);

  const getDeliveryCharge = (area) => {
    const lowerArea = (area || '').toLowerCase().trim();
    if (lowerArea.includes('dhaka') || lowerArea.includes('ঢাকা')) {
      return 60;
    }
    return 120;
  };
  
  const deliveryCharge = getDeliveryCharge(formData.deliveryArea);

  useEffect(() => {
    // Auto-detect delivery location and update state if needed
    const area = formData.deliveryArea.toLowerCase();
    const insideDhakaAreas = ['dhaka', 'dhanmondi', 'gulshan', 'banani', 'uttara'];
    const isInside = insideDhakaAreas.some(keyword => area.includes(keyword));
    const newLocation = isInside ? 'dhaka' : 'outside';
    if (newLocation !== deliveryLocation) {
      setDeliveryLocation(newLocation);
    }
  }, [formData.deliveryArea, deliveryLocation]);

  const totalProductCost = cartItems.reduce((sum, item) => {
    const price = getPrice(item);
    const qty = item.quantity || 1;
    return sum + (price * qty);
  }, 0);
  const total = totalProductCost + deliveryCharge;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentMethodChange = (value: string) => {
    setFormData(prev => ({ ...prev, paymentMethod: value }));
  };

  const increaseQty = (id) => {
    setCartItems((prev) => prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const decreaseQty = (id) => {
    setCartItems((prev) => prev.map(item => item.id === id && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast({
        title: "Terms & Conditions",
        description: "Please agree to the terms and conditions to proceed.",
        variant: "destructive"
      });
      setShowTermsWarning(true);
      // Scroll to top and focus the terms checkbox for mobile and desktop
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {}
      setTimeout(() => termsRef.current?.focus({ preventScroll: false }), 300);
      return;
    }

    // Front-end validation for required fields
    const requiredFields: Array<{ key: keyof typeof formData; label: string }> = [
      { key: 'firstName', label: 'নামের প্রথম অংশ' },
      { key: 'lastName', label: 'নামের শেষ অংশ' },
      { key: 'phone', label: 'ফোন' },
      { key: 'address', label: 'ঠিকানা' },
      { key: 'deliveryArea', label: 'ডেলিভারি এরিয়া' },
    ];
    const missing = requiredFields.find(f => !String(formData[f.key] || '').trim());
    if (missing) {
      toast({
        title: 'তথ্য প্রয়োজন',
        description: `${missing.label} পূরণ করুন`,
        variant: 'destructive'
      });
      const el = document.getElementById(missing.key as string) as HTMLInputElement | null;
      el?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare order data
      const orderProducts = cartItems.map(item => {
        const price = getPrice(item);
        return {
          id: String(item.id || ''),
          name: String(item.name || ''),
          price: Number(price || 0),
          quantity: Number(item.quantity || 1),
          mainImageUrl: getProductImage(item),
        };
      });
      const orderData = {
        products: orderProducts,
        totalPrice: orderProducts.reduce((sum, item) => sum + item.price * item.quantity, 0) + deliveryCharge,
        deliveryCharge,
        customer: {
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          email: formData.email || '',
          phone: formData.phone || '',
          address: formData.address || '',
          deliveryArea: formData.deliveryArea || ''
        },
        items: cartItems.map((item: any) => ({
          id: String(item.id || ''),
          name: String(item.name || ''),
          price: Number(getPrice(item) || 0),
          quantity: Number(item.quantity || 1),
          mainImageUrl: getProductImage(item),
        })) ?? [],
        paymentMethod: formData.paymentMethod || 'cod',
        bkashNumber: formData.paymentMethod === 'bkash' ? (formData.bkashNumber || '') : null,
        pricing: {
          subtotal: totalProductCost,
          deliveryCharge,
          total
        },
        status: 'pending',
        orderDate: new Date().toISOString(),
        orderNumber: 'AB' + Math.random().toString(36).substr(2, 9).toUpperCase()
      };

      // Submit to Firebase
      await addDoc(collection(db, 'orders'), orderData);

      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been submitted and will be processed soon.",
      });

      // Clear cart from localStorage
      localStorage.removeItem('cart');
      clearCart();
      
      // Redirect to success page
      navigate('/order-success', { 
        state: { orderData } 
      });
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: "Order Failed",
        description: error?.message || "There was an error submitting your order. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-white">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-orange-200 text-center max-w-md mx-4">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-orange-900 mb-2">Cart is empty</h2>
          <p className="text-orange-600 mb-6">Please add a product to your cart before checking out.</p>
          <Link to="/shop">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-50 to-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-orange-50 via-orange-50 to-white animate-pulse-slow"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 pb-24 lg:pb-8 checkout-container">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 bg-clip-text text-transparent mb-6">
            চেকআউট
          </h1>
          <p className="text-orange-700/80 text-xl font-medium max-w-2xl mx-auto">
            নিচের তথ্য পূরণ করে আপনার অর্ডারটি সম্পন্ন করুন।
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 checkout-form">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <Card className="bg-white/90 backdrop-blur-xl border border-orange-200/60">
              <CardHeader>
                <CardTitle className="text-orange-900 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  আপনার তথ্য
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-orange-700">নামের প্রথম অংশ</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-orange-700">নামের শেষ অংশ</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="border-orange-200 focus:border-orange-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-orange-700">ইমেল</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-orange-700">ফোন</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="border-orange-200 focus:border-orange-400"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address" className="text-orange-700">ঠিকানা</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryArea" className="text-orange-700">ডেলিভারি এরিয়া</Label>
                  <Input
                    id="deliveryArea"
                    name="deliveryArea"
                    value={formData.deliveryArea}
                    onChange={handleInputChange}
                    required
                    placeholder="উদাহরণ: ঢাকা, গুলশান"
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="bg-white/90 backdrop-blur-xl border border-orange-200/60">
              <CardHeader>
                <CardTitle className="text-orange-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  পেমেন্ট পদ্ধতি
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={formData.paymentMethod} onValueChange={handlePaymentMethodChange}>
                  <div className="flex items-center space-x-2 mb-4">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="text-orange-700">ক্যাশ অন ডেলিভারি</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bkash" id="bkash" />
                    <Label htmlFor="bkash" className="text-orange-700">বিকাশ</Label>
                  </div>
                </RadioGroup>
                
                {formData.paymentMethod === 'bkash' && (
                  <div className="mt-4">
                    <Label htmlFor="bkashNumber" className="text-orange-700">বিকাশ নম্বর</Label>
                    <Input
                      id="bkashNumber"
                      name="bkashNumber"
                      value={formData.bkashNumber}
                      onChange={handleInputChange}
                      placeholder="০১XXXXXXXXX"
                      className="border-orange-200 focus:border-orange-400"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Terms and Conditions */}
            <Card className="bg-white/90 backdrop-blur-xl border border-orange-200/60">
              <CardContent className="pt-4">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    ref={termsRef}
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-orange-700 text-sm">
                    আমি নিশ্চিত হয়ে এবং শর্তাবলী মান্য করে অর্ডার করছি । 
                  </Label>
                </div>
                {showTermsWarning && (
                  <p className="text-red-500 text-sm mt-2">আগাতে হলে শর্তাবলীতে সম্মতি দিন।</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Order Summary - show first on mobile */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <Card className="bg-white/90 backdrop-blur-xl border border-orange-200/60 lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle className="text-orange-900 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  আপনার অর্ডার
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => {
                    const price = getPrice(item);
                    const hasDiscount = hasValidDiscount(item);
                    const originalPrice = Number(item.price);
                    
                    return (
                      <div key={item.id} className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                        <div className="w-14 h-14 bg-white rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
                          <img
                            src={getDisplayImageUrl(item.mainImageUrl || getProductImage(item))}
                            alt={item.name || 'Product'}
                            className="w-full h-full object-contain p-0.5"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.src.endsWith(PLACEHOLDER_IMAGE)) {
                                target.src = PLACEHOLDER_IMAGE;
                              }
                              target.onerror = null;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-orange-900 truncate">{item.name}</h4>
                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            {hasDiscount ? (
                              <>
                                <span className="text-xs text-gray-400 line-through">৳{new Intl.NumberFormat('en-US').format(originalPrice)}</span>
                                <span className="text-sm font-bold text-orange-600">৳{new Intl.NumberFormat('en-US').format(price)}</span>
                              </>
                            ) : (
                              <span className="text-sm font-bold text-orange-600">৳{new Intl.NumberFormat('en-US').format(price)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => decreaseQty(item.id)}
                            className="w-6 h-6 p-0 border-orange-300 text-orange-700"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium text-orange-900 w-8 text-center">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => increaseQty(item.id)}
                            className="w-6 h-6 p-0 border-orange-300 text-orange-700"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Summary */}
                <div className="border-t border-orange-200 pt-4 space-y-2">
                  <div className="flex justify-between text-orange-700">
                    <span>মোট</span>
                    <span>৳{new Intl.NumberFormat('en-US').format(totalProductCost)}</span>
                  </div>
                  <div className="flex justify-between text-orange-700">
                    <span>ডেলিভারি চার্জ</span>
                    <span>৳{new Intl.NumberFormat('en-US').format(deliveryCharge)}</span>
                  </div>
                  <div className="border-t border-orange-200 pt-2">
                    <div className="flex justify-between text-orange-900 font-bold text-lg">
                      <span>সর্বমোট</span>
                      <span>৳{new Intl.NumberFormat('en-US').format(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Optimized Order Button */}
                <div className="lg:hidden mt-6">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !agreedToTerms}
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-600 hover:from-orange-700 hover:to-orange-700 text-white py-4 text-lg rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        প্রক্রিয়াকরণ হচ্ছে...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        অর্ডার করুন
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Desktop Order Button */}
            <div className="hidden lg:block">
              <Button 
                type="submit" 
                disabled={isSubmitting || !agreedToTerms}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    প্রক্রিয়াকরণ হচ্ছে...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    অর্ডার করুন
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
        
        {/* Sticky Mobile Confirm Button */}
        <div className="lg:hidden sticky-mobile-button">
          <Button 
            type="submit" 
            disabled={isSubmitting || !agreedToTerms}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                প্রক্রিয়াকরণ হচ্ছে...
              </div>
            ) : (
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                অর্ডার করুন
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

