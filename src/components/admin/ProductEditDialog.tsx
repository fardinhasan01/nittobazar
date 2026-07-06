import React, { useEffect, useState } from 'react';
import { useAdminScrollUnlock } from '@/lib/adminScrollLock';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { update, ref } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { sanitizeDatabaseValue } from '@/lib/rtdb';

export interface EditableProduct {
  id: string;
  name: string;
  mainPrice?: number;
  offerPrice?: number | null;
  description?: string;
  inStock?: boolean;
  stock?: number;
}

interface ProductEditDialogProps {
  product: EditableProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const ProductEditDialog: React.FC<ProductEditDialogProps> = ({
  product,
  open,
  onOpenChange,
  onSaved,
}) => {
  useAdminScrollUnlock(open);
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [mainPrice, setMainPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
  const [inStock, setInStock] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setName(product.name ?? '');
    setMainPrice(String(product.mainPrice ?? ''));
    setOfferPrice(product.offerPrice != null ? String(product.offerPrice) : '');
    setDescription(product.description ?? '');
    setStock(String(product.stock ?? 0));
    setInStock(product.inStock !== false);
  }, [product]);

  const handleSave = async () => {
    if (!product) return;
    if (!name.trim()) {
      toast({ title: 'Validation', description: 'Product name is required', variant: 'destructive' });
      return;
    }
    const mainPriceNum = parseFloat(mainPrice);
    if (!mainPrice.trim() || Number.isNaN(mainPriceNum) || mainPriceNum <= 0) {
      toast({ title: 'Validation', description: 'Enter a valid main price', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        mainPrice: mainPriceNum,
        description: description.trim(),
        inStock,
        stock: parseInt(stock || '0', 10) || 0,
      };
      if (offerPrice.trim()) {
        payload.offerPrice = parseFloat(offerPrice);
      } else {
        payload.offerPrice = null;
      }
      await update(ref(database, `products/${product.id}`), sanitizeDatabaseValue(payload) as Record<string, unknown>);
      toast({ title: 'Product updated', description: 'Changes saved successfully.' });
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to update product.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-dialog-content max-h-[90vh] overflow-y-auto w-[calc(100vw-1.5rem)] max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit product</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 min-h-11" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Main price (৳)</Label>
              <Input
                inputMode="decimal"
                value={mainPrice}
                onChange={(e) => setMainPrice(e.target.value.replace(/[^\d.]/g, ''))}
                className="mt-1 min-h-11"
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
              />
            </div>
          </div>
          <div>
            <Label>Stock</Label>
            <Input
              inputMode="numeric"
              value={stock}
              onChange={(e) => setStock(e.target.value.replace(/\D/g, ''))}
              className="mt-1 min-h-11"
            />
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[88px]"
            />
          </div>
          <label className="flex items-center gap-3 min-h-11 touch-manipulation cursor-pointer">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="h-5 w-5 rounded"
            />
            <span className="text-sm font-medium">In stock</span>
          </label>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="min-h-11 w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" className="min-h-11 w-full sm:w-auto" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditDialog;
