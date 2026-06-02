// ✅ FILE: /src/context/CartContext.jsx
import React, { useEffect, useState, createContext, useContext } from 'react';
import { resolveItemImageUrl, PLACEHOLDER_IMAGE } from '@/lib/utils';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      try {
        const parsedCart = JSON.parse(stored);
        // Check if cart contains mock/default data and clear it
        const hasMockData = parsedCart.some(item => 
          item.name === "iPhone 15 Pro Max" || 
          item.name === "AirPods Pro 2" ||
          item.price === 1199 ||
          item.price === 249
        );
        if (hasMockData) {
          localStorage.removeItem('cart');
          setCart([]);
        } else {
          setCart(
            parsedCart.map((item) => {
              const mainImageUrl = resolveItemImageUrl(item);
              return {
                ...item,
                mainImageUrl: mainImageUrl === PLACEHOLDER_IMAGE ? item.mainImageUrl : mainImageUrl,
                quantity: item.quantity > 0 ? item.quantity : 1,
              };
            })
          );
        }
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        localStorage.removeItem('cart');
        setCart([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    const normalizedPrice = Number(product.price ?? product.mainPrice) || 0;
    const normalizedOffer = product.offerPrice != null ? Number(product.offerPrice) : null;
    const effectivePrice = normalizedOffer && normalizedOffer > 0 && normalizedOffer < normalizedPrice 
      ? normalizedOffer 
      : normalizedPrice;

    const normalized = {
      id: String(product.id),
      name: product.name,
      price: normalizedPrice,
      offerPrice: normalizedOffer,
      quantity: 1,
      mainImageUrl: resolveItemImageUrl(product),
    };

    setCart((prev) => {
      const existingItem = prev.find(item => item.id === normalized.id);
      if (existingItem) {
        // Update quantity if item already exists
        return prev.map(item => 
          item.id === normalized.id 
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                mainImageUrl:
                  normalized.mainImageUrl !== PLACEHOLDER_IMAGE
                    ? normalized.mainImageUrl
                    : item.mainImageUrl,
              }
            : item
        );
      } else {
        // Add new item with normalized info
        return [...prev, normalized];
      }
    });
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) => 
      prev.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    localStorage.removeItem('cart');
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      setCart, 
      addToCart, 
      updateQuantity,
      removeFromCart,
      clearCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};
