import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Optimizes image URLs for high-quality display
 * @param imageUrl - The original image URL
 * @param options - Optional parameters for image optimization
 * @returns Optimized image URL with quality parameters
 */
export function getOptimizedImageUrl(
  imageUrl: string, 
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | 'best' | 'good' | 'eco' | 'low';
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  } = {}
): string {
  if (!imageUrl) return '';
  
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fit'
  } = options;

  // If it's already a Cloudinary URL, optimize it
  if (imageUrl.includes('cloudinary.com')) {
    try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    
    // Find the upload index
    const uploadIndex = pathParts.findIndex(part => part === 'upload');
    if (uploadIndex !== -1) {
      // Insert quality and format parameters after 'upload'
      const transformations = [];
      
      const cropMode =
        crop === 'thumb' ? 'thumb' : crop === 'fill' ? 'fill' : crop === 'scale' ? 'scale' : 'fit';
      transformations.push(`c_${cropMode}`);
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      transformations.push(quality === 'best' ? 'q_auto:best' : `q_${quality}`, `f_${format}`);
      
      const optimizedPath = [
        ...pathParts.slice(0, uploadIndex + 1),
        transformations.join('/'),
        ...pathParts.slice(uploadIndex + 1)
      ].join('/');
      
      return `${url.protocol}//${url.host}${optimizedPath}`;
    }
    } catch {
      return imageUrl;
    }
  }
  
  // For non-Cloudinary URLs, return as is
  return imageUrl;
}

/**
 * Gets a high-quality product image URL optimized for display
 * @param imageUrl - The original product image URL (can be imageUrl, mainImage, or image field)
 * @param size - The desired size (default: 'medium')
 * @returns Optimized image URL or placeholder
 */
export function getProductImageUrl(
  imageUrl: string | undefined | null, 
  size: 'thumbnail' | 'small' | 'medium' | 'large' | 'full' = 'medium'
): string {
  // Return placeholder if no image URL provided
  if (!imageUrl || imageUrl.trim() === '') {
    return '/placeholder.svg';
  }

  const sizeMap = {
    thumbnail: { width: 100, height: 100, crop: 'thumb' as const },
    small: { width: 200, height: 200, crop: 'fill' as const },
    medium: { width: 400, height: 400, crop: 'fit' as const },
    large: { width: 600, height: 600, crop: 'fit' as const },
    full: { crop: 'fit' as const }
  };
  
  return getOptimizedImageUrl(imageUrl, {
    ...sizeMap[size],
    quality: 'best',
    format: 'auto'
  });
}

/**
 * Gets the best available image URL from a product object
 * @param product - The product object
 * @returns The best available image URL or placeholder
 */
export const PLACEHOLDER_IMAGE = '/placeholder.svg';

/** Resolve raw image field from cart/order/product objects */
export function resolveItemImageUrl(item: Record<string, unknown> | null | undefined): string {
  if (!item) return PLACEHOLDER_IMAGE;

  const pick = (value: unknown): string => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    return '';
  };

  const fromArray = (value: unknown): string => {
    if (Array.isArray(value) && value.length > 0) {
      return pick(value[0]);
    }
    return '';
  };

  const url =
    pick(item.mainImageUrl) ||
    pick(item.mainImage) ||
    pick(item.imageUrl) ||
    fromArray(item.image) ||
    pick(item.image);

  if (!url || url === '/placeholder.jpg') return PLACEHOLDER_IMAGE;
  return url;
}

export function getProductImage(product: Record<string, unknown> | null | undefined): string {
  return resolveItemImageUrl(product);
}

/** Use stored product URL as-is (checkout/cart) — avoids broken transforms */
export function getDisplayImageUrl(
  imageUrl: string | undefined | null,
  _size?: 'thumbnail' | 'small' | 'medium' | 'large' | 'full'
): string {
  if (!imageUrl || imageUrl.trim() === '' || imageUrl.includes('placeholder')) {
    return PLACEHOLDER_IMAGE;
  }
  return imageUrl.trim();
}

/** Read image URL from a Firestore product document */
export function imageUrlFromFirestoreProduct(data: Record<string, unknown> | undefined): string {
  if (!data) return PLACEHOLDER_IMAGE;
  return resolveItemImageUrl(data as Record<string, unknown>);
}

/** Normalize cart line item so checkout always has mainImageUrl */
export function normalizeCartItem<T extends Record<string, unknown>>(item: T): T & { mainImageUrl: string; quantity: number } {
  const mainImageUrl = resolveItemImageUrl(item);
  return {
    ...item,
    mainImageUrl,
    quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
  };
}

/**
 * Safe price calculation helper that handles both string and number values
 * @param item - Product item with price and offerPrice
 * @returns The correct price to use (offerPrice if valid, otherwise price)
 */
export const getPrice = (item: { price?: any; mainPrice?: any; offerPrice?: any }) => {
  const base = item.price ?? item.mainPrice;
  const price = Number(base);
  const offer = Number(item.offerPrice);

  // If offerPrice is valid and less than main price, use it
  if (!isNaN(offer) && offer > 0 && offer < price) return offer;
  
  // If main price is valid, use it
  if (!isNaN(price) && price > 0) return price;
  
  // Fallback to 0 if both are invalid
  return 0;
};

/**
 * Check if an item has a valid discount
 * @param item - Product item with price and offerPrice
 * @returns boolean indicating if discount should be shown
 */
export const hasValidDiscount = (item: { price?: any; mainPrice?: any; offerPrice?: any }) => {
  const base = item.price ?? item.mainPrice;
  const price = Number(base);
  const offer = Number(item.offerPrice);
  
  return !isNaN(offer) && offer > 0 && offer < price;
};
