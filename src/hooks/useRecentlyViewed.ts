import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'ab-recently-viewed';
const MAX_ITEMS = 12;

export interface RecentProduct {
  id: string;
  name: string;
  mainImageUrl?: string;
  price?: number;
  offerPrice?: number | null;
  category?: string;
  rating?: number;
}

export function useRecentlyViewed() {
  const [recent, setRecent] = useState<RecentProduct[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  }, [recent]);

  const addRecent = useCallback((product: RecentProduct) => {
    setRecent((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      return [product, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  return { recent, addRecent };
}
