import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface WishlistItem {
  id: string;
  name: string;
  mainImageUrl?: string;
  price?: number;
  offerPrice?: number | null;
}

const WishlistContext = createContext<{
  wishlist: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
}>({ wishlist: [], toggleWishlist: () => {}, isInWishlist: () => false });

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    try {
      const stored = localStorage.getItem('ab-wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('ab-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const isInWishlist = useCallback(
    (id: string) => wishlist.some((w) => w.id === id),
    [wishlist]
  );

  const toggleWishlist = useCallback((item: WishlistItem) => {
    setWishlist((prev) => {
      const exists = prev.some((w) => w.id === item.id);
      if (exists) return prev.filter((w) => w.id !== item.id);
      return [...prev, item];
    });
  }, []);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
