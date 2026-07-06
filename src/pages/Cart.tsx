import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { getPrice, hasValidDiscount } from '@/lib/utils';

const Cart = () => {
  const { cart: cartItems, updateQuantity, removeFromCart, setCart: setCartItems } = useCart();

  useEffect(() => {
    // Context provides the cart items, so this ensures component state is in sync.
  }, [cartItems]);

  // Clear any leftover default values from localStorage
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        // Check if cart contains mock/default data and clear it
        const hasMockData = parsedCart.some(item => 
          item.name === "iPhone 15 Pro Max" || 
          item.name === "AirPods Pro 2" ||
          item.price === 1199 ||
          item.price === 249
        );
        if (hasMockData) {
          localStorage.removeItem('cart');
          // The context will handle clearing the cart
        }
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity > 0) {
      updateQuantity(id, newQuantity);
    } else {
      removeFromCart(id);
    }
  };

  const handleRemoveItem = (id) => {
    removeFromCart(id);
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const price = getPrice(item);
    return sum + (price * item.quantity);
  }, 0);
  
  const deliveryFee = 60; // Example flat fee, can be dynamic
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen relative overflow-hidden bg-green-50">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-yellow-50 to-white animate-pulse-slow"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="flex items-center mb-12 animate-fade-in">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mr-4">
            <ShoppingBag className="w-6 h-6 text-green-700" />
          </div>
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-700 to-red-600 bg-clip-text text-transparent">
              Shopping Cart
            </h1>
            <p className="text-green-800/80 text-lg mt-2">Review your items and proceed to checkout</p>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="w-16 h-16 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-green-800 mb-4">Your cart is empty</h2>
            <p className="text-green-700 text-lg mb-8 max-w-md mx-auto">আপনার শপিং কার্টে কিছু পণ্য যুক্ত করে কেনাকাটা শুরু করুন!</p>
            <Link to="/shop">
              <Button className="bg-gradient-to-r from-green-600 to-yellow-500 hover:from-green-700 hover:to-yellow-600 text-white px-8 py-4 text-lg rounded-xl font-semibold transition-all duration-300 animate-glow">
                <Sparkles className="w-5 h-5 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item, index) => {
                const price = getPrice(item);
                const hasDiscount = hasValidDiscount(item);
                const originalPrice = Number(item.price);

                return (
                  <Card 
                    key={item.id} 
                    className="bg-white/90 backdrop-blur-xl border border-green-200/50 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-6">
                        <div className="relative w-24 h-24 bg-green-50 rounded-2xl flex-shrink-0">
                          <img
                            src={
                              item.mainImageUrl ||
                              (Array.isArray(item.image) ? item.image[0] : item.image) ||
                              "/placeholder.jpg"
                            }
                            alt={item.name}
                            className="w-full h-48 object-contain rounded-xl shadow bg-green-50"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder.jpg';
                              target.onerror = null; // Prevent loops
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-green-900 mb-2 line-clamp-2">{item.name}</h3>
                          <div className="flex items-center gap-3">
                            {hasDiscount ? (
                              <>
                                <span className="text-gray-400 line-through text-lg">৳{new Intl.NumberFormat('en-US').format(originalPrice)}</span>
                                <span className="text-green-600 font-bold text-2xl">৳{new Intl.NumberFormat('en-US').format(price)}</span>
                              </>
                            ) : (
                              <span className="text-green-700 font-bold text-2xl">৳{new Intl.NumberFormat('en-US').format(price)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="border-green-300 text-green-800 hover:bg-green-100 hover:border-green-400 transition-all duration-300 rounded-full"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="text-green-900 font-bold text-lg w-10 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="border-green-300 text-green-800 hover:bg-green-100 hover:border-green-400 transition-all duration-300 rounded-full"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-100 transition-all duration-300 rounded-full"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-white/90 backdrop-blur-xl border border-green-200/50 sticky top-24 shadow-2xl animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <CardContent className="p-8">
                  <div className="flex items-center mb-8">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                      <Sparkles className="w-5 h-5 text-green-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-green-900">Order Summary</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between text-green-800">
                      <span className="text-lg">Subtotal</span>
                      <span className="text-lg font-semibold">৳{new Intl.NumberFormat('en-US').format(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-green-800">
                      <span className="text-lg">Delivery Fee</span>
                      <span className="text-lg font-semibold">৳{new Intl.NumberFormat('en-US').format(deliveryFee)}</span>
                    </div>
                    <div className="border-t border-green-200 pt-6">
                      <div className="flex justify-between text-green-900 font-bold text-2xl">
                        <span>Total</span>
                        <span>৳{new Intl.NumberFormat('en-US').format(total)}</span>
                      </div>
                    </div>
                  </div>

                  <Link to="/checkout" className="block mt-8">
                    <Button className="w-full bg-gradient-to-r from-green-600 to-red-500 hover:from-green-700 hover:to-red-600 text-white py-4 text-lg rounded-xl font-semibold transition-all duration-300 flex items-center justify-center animate-glow">
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;

