import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { database } from '@/lib/firebase';
import { push, ref, set } from 'firebase/database';
import { uploadFileToCloudinary } from '@/lib/cloudinary';
import MobileFilePicker from '@/components/admin/MobileFilePicker';
import { Loader2, X } from 'lucide-react';
import { normalizeString, normalizeStringArray, sanitizeDatabaseValue } from '@/lib/rtdb';

const TAGS = ['Hot', 'Exclusive', 'Trending'];
const CATEGORIES = [
  'General',
  'Headphones',
  'Selfie Sticks',
  'Microphones',
  'Toys',
  'Smart Watches',
  'Phone Accessories',
  'Hidden Cameras',
  'Misc',
];

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface FileWithPreview {
  file: File;
  preview: string;
  url?: string;
  status: UploadStatus;
  progress?: number;
  error?: string;
}

const AddProduct: React.FC = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [mainPrice, setMainPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [stock, setStock] = useState('10');
  const [rating, setRating] = useState('4.5');
  const [featured, setFeatured] = useState(false);
  const [mainImage, setMainImage] = useState<FileWithPreview | null>(null);
  const [additionalImages, setAdditionalImages] = useState<FileWithPreview[]>([]);
  const [video, setVideo] = useState<FileWithPreview | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overallProgress, setOverallProgress] = useState<number | null>(null);

  const parseFiniteNumber = (value: string, fallback = 0) => {
    const parsed = Number.parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const parseFiniteInt = (value: string, fallback = 0) => {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const uploadWithTimeout = async <T,>(promise: Promise<T>, label: string, timeoutMs = 180000) => {
    let timeoutId: number | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]) as T;
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  };

  const markUploadError = (message: string) => {
    setMainImage((prev) => (prev ? { ...prev, status: 'error', error: message } : prev));
    setAdditionalImages((prev) =>
      prev.map((img) =>
        img.status === 'uploading' ? { ...img, status: 'error', error: message } : img
      )
    );
    setVideo((prev) => (prev && prev.status === 'uploading' ? { ...prev, status: 'error', error: message } : prev));
  };

  const validateImageFile = (file: File): boolean => {
    if (
      !file.type.startsWith('image/') &&
      !file.name.match(/\.(jpe?g|png|gif|webp|avif)$/i)
    ) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Images must be under 10MB.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleMainFiles = (files: File[]) => {
    const file = files[0];
    if (!file || !validateImageFile(file)) return;
    if (mainImage) URL.revokeObjectURL(mainImage.preview);
    setMainImage({ file, preview: URL.createObjectURL(file), status: 'idle' });
  };

  const handleAdditionalFiles = (files: File[]) => {
    const valid: FileWithPreview[] = [];
    for (const file of files) {
      if (!validateImageFile(file)) continue;
      valid.push({ file, preview: URL.createObjectURL(file), status: 'idle' });
    }
    if (additionalImages.length + valid.length > 5) {
      toast({
        title: 'Too many images',
        description: 'Maximum 5 additional images.',
        variant: 'destructive',
      });
      return;
    }
    setAdditionalImages((prev) => [...prev, ...valid]);
  };

  const handleVideoFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|webm)$/i)) {
      toast({
        title: 'Invalid file',
        description: 'Please select a video file.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Video must be under 50MB.',
        variant: 'destructive',
      });
      return;
    }
    if (video) URL.revokeObjectURL(video.preview);
    setVideo({ file, preview: URL.createObjectURL(file), status: 'idle' });
  };

  const handleTagChange = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const validate = () => {
    if (!name.trim()) {
      toast({ title: 'Validation', description: 'Product name is required', variant: 'destructive' });
      return false;
    }
    const mainPriceNum = parseFloat(mainPrice);
    if (!mainPrice.trim() || Number.isNaN(mainPriceNum) || mainPriceNum <= 0) {
      toast({ title: 'Validation', description: 'Enter a valid main price', variant: 'destructive' });
      return false;
    }
    if (offerPrice.trim()) {
      const offerPriceNum = parseFloat(offerPrice);
      if (Number.isNaN(offerPriceNum) || offerPriceNum <= 0 || offerPriceNum >= mainPriceNum) {
        toast({
          title: 'Validation',
          description: 'Offer price must be less than main price',
          variant: 'destructive',
        });
        return false;
      }
    }
    if (!mainImage?.file) {
      toast({ title: 'Validation', description: 'Main image is required', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const uploadAllFiles = async () => {
    console.log('uploadAllFiles() start');
    let done = 0;
    const total = 1 + additionalImages.length + (video?.file ? 1 : 0);
    const tick = () => {
      done += 1;
      setOverallProgress(Math.min(100, Math.round((done / total) * 100)));
    };

    setOverallProgress(0);

    let mainImageUrl = '';
    if (mainImage?.file) {
      setMainImage((prev) => prev && { ...prev, status: 'uploading', progress: 0 });
      console.log('before uploadFileToCloudinary() main image');
      mainImageUrl = await uploadWithTimeout(
        uploadFileToCloudinary(mainImage.file, (p) =>
          setMainImage((prev) => prev && { ...prev, progress: p })
        ),
        'Main image upload'
      );
      console.log('after uploadFileToCloudinary() main image', mainImageUrl);
      setMainImage((prev) => prev && { ...prev, url: mainImageUrl, status: 'success', progress: 100 });
      tick();
    }

    const additionalImageUrlsPromise = Promise.all(
      additionalImages.map(async (img, index) => {
        setAdditionalImages((prev) =>
          prev.map((item, idx) => (idx === index ? { ...item, status: 'uploading', progress: 0 } : item))
        );
        console.log('before uploadFileToCloudinary() additional image', index);
        const url = await uploadWithTimeout(
          uploadFileToCloudinary(img.file, (p) =>
            setAdditionalImages((prev) =>
              prev.map((item, idx) => (idx === index ? { ...item, progress: p } : item))
            )
          ),
          `Additional image ${index + 1} upload`
        );
        console.log('after uploadFileToCloudinary() additional image', index, url);
        setAdditionalImages((prev) =>
          prev.map((item, idx) =>
            idx === index ? { ...item, url, status: 'success', progress: 100 } : item
          )
        );
        tick();
        return url;
      })
    );

    const videoUrlPromise = video?.file
      ? (async () => {
          setVideo((prev) => prev && { ...prev, status: 'uploading', progress: 0 });
          console.log('before uploadFileToCloudinary() video');
          const url = await uploadWithTimeout(
            uploadFileToCloudinary(video.file, (p) =>
              setVideo((prev) => prev && { ...prev, progress: p })
            ),
            'Video upload'
          );
          console.log('after uploadFileToCloudinary() video', url);
          setVideo((prev) => prev && { ...prev, url, status: 'success', progress: 100 });
          tick();
          return url;
        })()
      : Promise.resolve(null);

    const [additionalImageUrls, videoUrl] = await Promise.all([
      additionalImageUrlsPromise,
      videoUrlPromise,
    ]);

    const safeAdditionalImageUrls = additionalImageUrls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
    const safeMainImageUrl = typeof mainImageUrl === 'string' ? mainImageUrl.trim() : '';
    const safeVideoUrl = typeof videoUrl === 'string' && videoUrl.trim().length > 0 ? videoUrl.trim() : null;

    console.log('uploadAllFiles() resolved', {
      mainImageUrl: safeMainImageUrl,
      additionalImageUrls: safeAdditionalImageUrls,
      videoUrl: safeVideoUrl,
    });

    setOverallProgress(100);
    return { mainImageUrl: safeMainImageUrl, additionalImageUrls: safeAdditionalImageUrls, videoUrl: safeVideoUrl };
  };

  const resetForm = () => {
    if (mainImage) URL.revokeObjectURL(mainImage.preview);
    additionalImages.forEach((img) => URL.revokeObjectURL(img.preview));
    if (video) URL.revokeObjectURL(video.preview);
    setName('');
    setMainPrice('');
    setOfferPrice('');
    setDescription('');
    setCategory('General');
    setStock('10');
    setRating('4.5');
    setFeatured(false);
    setMainImage(null);
    setAdditionalImages([]);
    setVideo(null);
    setTags([]);
    setInStock(true);
    setOverallProgress(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit() start');
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const { mainImageUrl, additionalImageUrls, videoUrl } = await uploadAllFiles();
      const imageGallery = [mainImageUrl, ...additionalImageUrls].map(normalizeString).filter(Boolean);
      const mainPriceValue = parseFiniteNumber(mainPrice, 0);
      const offerPriceValue = offerPrice.trim() ? parseFiniteNumber(offerPrice, NaN) : null;
      const stockValue = parseFiniteInt(stock, 0);
      const ratingValue = parseFiniteNumber(rating, 4.5);

      if (!mainImageUrl) {
        throw new Error('Main image upload did not return a secure URL');
      }
      if (!Number.isFinite(mainPriceValue) || mainPriceValue <= 0) {
        throw new Error('Main price is invalid');
      }
      if (offerPriceValue !== null && (!Number.isFinite(offerPriceValue) || offerPriceValue <= 0 || offerPriceValue >= mainPriceValue)) {
        throw new Error('Offer price is invalid');
      }
      if (!Number.isFinite(stockValue) || stockValue < 0) {
        throw new Error('Stock is invalid');
      }
      if (!Number.isFinite(ratingValue) || ratingValue < 0 || ratingValue > 5) {
        throw new Error('Rating is invalid');
      }

      const productData = {
        name: normalizeString(name),
        mainPrice: mainPriceValue,
        offerPrice: offerPriceValue,
        description: normalizeString(description),
        category: normalizeString(category) || 'General',
        stock: stockValue,
        rating: ratingValue,
        featured,
        mainImageUrl,
        mainImage: mainImageUrl,
        imageUrl: mainImageUrl,
        image: mainImageUrl,
        images: imageGallery,
        additionalImageUrls,
        videoUrl,
        media: {
          mainImageUrl,
          additionalImageUrls,
          videoUrl,
        },
        inStock,
        tags: normalizeStringArray(tags),
        createdAt: Date.now(),
      };

      const newProductRef = push(ref(database, 'products'));
      if (!newProductRef.key) {
        throw new Error('Could not generate a product key');
      }
      const productId = newProductRef.key;
      const productDataForDatabase = sanitizeDatabaseValue({
        ...productData,
        id: productId,
      }) as Record<string, unknown>;
      if (!productDataForDatabase || Array.isArray(productDataForDatabase)) {
        throw new Error('Product payload could not be normalized for Realtime Database');
      }

      const productDataForLog = {
        ...productDataForDatabase,
        createdAt: '[timestamp]',
      };

      console.log('RTDB path:', `products/${productId}`);
      console.log('RTDB Payload:', JSON.stringify(productDataForLog, null, 2));
      console.log('before Firestore save');
      await set(newProductRef, productDataForDatabase);
      console.log('after Firestore save');
      toast({ title: 'Success', description: 'Product added successfully!' });
      resetForm();
    } catch (error) {
      console.error('Firestore Error:', error);
      console.error('Error adding product:', error);
      markUploadError(error instanceof Error ? error.message : 'Upload failed');
      toast({
        title: 'Error',
        description: 'Failed to upload or save product. Try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setOverallProgress(null);
    }
  };

  const isBusy = isSubmitting;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 bg-white/90 p-4 sm:p-6 rounded-2xl border border-premium-200/60 shadow-lg max-w-4xl mx-auto w-full overflow-hidden"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-premium-700">Add new product</h2>

      {overallProgress !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Uploading media…</span>
            <span>{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Product name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 min-h-11"
            disabled={isBusy}
          />
        </div>
        <div>
          <Label>Main price (৳)</Label>
          <Input
            inputMode="decimal"
            value={mainPrice}
            onChange={(e) => setMainPrice(e.target.value.replace(/[^\d.]/g, ''))}
            required
            placeholder="1200"
            className="mt-1 min-h-11"
            disabled={isBusy}
          />
        </div>
        <div>
          <Label>Category</Label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full min-h-11 rounded-md border border-input bg-background px-3 text-sm"
            disabled={isBusy}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Stock</Label>
          <Input
            inputMode="numeric"
            value={stock}
            onChange={(e) => setStock(e.target.value.replace(/\D/g, ''))}
            className="mt-1 min-h-11"
            disabled={isBusy}
          />
        </div>
        <div>
          <Label>Offer price (৳)</Label>
          <Input
            inputMode="decimal"
            value={offerPrice}
            onChange={(e) => setOfferPrice(e.target.value.replace(/[^\d.]/g, ''))}
            placeholder="Optional"
            className="mt-1 min-h-11"
            disabled={isBusy}
          />
        </div>
        <div>
          <Label>Rating (0–5)</Label>
          <Input
            inputMode="decimal"
            value={rating}
            onChange={(e) => setRating(e.target.value.replace(/[^\d.]/g, ''))}
            className="mt-1 min-h-11"
            disabled={isBusy}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-3 min-h-11 touch-manipulation cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="h-5 w-5"
            disabled={isBusy}
          />
          In stock
        </label>
        <label className="flex items-center gap-3 min-h-11 touch-manipulation cursor-pointer">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-5 w-5"
            disabled={isBusy}
          />
          Featured
        </label>
      </div>

      <div>
        <Label>Description</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[88px]"
          disabled={isBusy}
        />
      </div>

      <MobileFilePicker
        label="Main image *"
        accept="image/*"
        onFiles={handleMainFiles}
        disabled={isBusy}
        hint="JPEG, PNG, WebP — max 10MB"
      />
      {mainImage && (
        <div className="relative inline-block">
          <img
            src={mainImage.url || mainImage.preview}
            alt="Main"
            className="w-28 h-28 object-cover rounded-lg border"
          />
          {mainImage.status === 'uploading' && mainImage.progress !== undefined && (
            <Progress value={mainImage.progress} className="h-1 mt-1 w-28" />
          )}
          <button
            type="button"
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 min-h-8 min-w-8 touch-manipulation"
            onClick={() => {
              URL.revokeObjectURL(mainImage.preview);
              setMainImage(null);
            }}
            aria-label="Remove main image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <MobileFilePicker
        label="Additional images"
        accept="image/*"
        multiple
        onFiles={handleAdditionalFiles}
        disabled={isBusy}
        hint="Up to 5 images"
      />
      {additionalImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {additionalImages.map((img, i) => (
            <div key={i} className="relative">
              <img src={img.url || img.preview} alt="" className="w-16 h-16 object-cover rounded border" />
              {img.status === 'uploading' && img.progress !== undefined && (
                <Progress value={img.progress} className="h-1 w-16 mt-0.5" />
              )}
              <button
                type="button"
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 touch-manipulation"
                onClick={() => {
                  URL.revokeObjectURL(img.preview);
                  setAdditionalImages((prev) => prev.filter((_, idx) => idx !== i));
                }}
                aria-label="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <MobileFilePicker
        label="Video (optional)"
        accept="video/*"
        showCamera={false}
        onFiles={handleVideoFiles}
        disabled={isBusy}
        hint="MP4, MOV — max 50MB"
      />
      {video && (
        <div className="space-y-1">
          <video src={video.url || video.preview} controls className="w-full max-w-xs rounded border" />
          {video.status === 'uploading' && video.progress !== undefined && (
            <Progress value={video.progress} className="h-2 max-w-xs" />
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10 touch-manipulation"
            onClick={() => {
              URL.revokeObjectURL(video.preview);
              setVideo(null);
            }}
          >
            Remove video
          </Button>
        </div>
      )}

      <div>
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-4 mt-2">
          {TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-2 min-h-11 touch-manipulation cursor-pointer">
              <input
                type="checkbox"
                checked={tags.includes(tag)}
                onChange={() => handleTagChange(tag)}
                className="h-5 w-5"
                disabled={isBusy}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isBusy}
        className="w-full min-h-12 text-base touch-manipulation bg-gradient-to-r from-premium-500 to-emerald-600"
      >
        {isBusy ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {overallProgress !== null ? `Uploading ${overallProgress}%…` : 'Saving…'}
          </>
        ) : (
          'Add product'
        )}
      </Button>
    </form>
  );
};

export default AddProduct;
