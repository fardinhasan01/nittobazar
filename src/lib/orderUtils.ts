export function parseOrderDate(value: unknown): Date {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date(0) : d;
  }
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    const seconds = Number((value as { seconds: number }).seconds);
    return new Date(seconds * 1000);
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return new Date(0);
    }
  }
  return new Date(0);
}

export function formatOrderDate(value: unknown): string {
  const d = parseOrderDate(value);
  if (d.getTime() === 0) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export interface NormalizedCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  deliveryArea: string;
}

export function normalizeCustomer(raw: unknown): NormalizedCustomer {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, string>;
  return {
    firstName: c.firstName ?? '',
    lastName: c.lastName ?? '',
    email: c.email ?? '—',
    phone: c.phone ?? '',
    address: c.address ?? '—',
    deliveryArea: c.deliveryArea ?? '',
  };
}

export function normalizeOrderItems(raw: unknown): Array<{
  id?: number;
  name: string;
  price?: number;
  quantity: number;
  offerPrice?: number;
  mainPrice?: number;
}> {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    return {
      id: typeof row.id === 'number' ? row.id : index,
      name: String(row.name ?? 'Item'),
      price: row.price != null ? Number(row.price) : undefined,
      quantity: Number(row.quantity) > 0 ? Number(row.quantity) : 1,
      offerPrice: row.offerPrice != null ? Number(row.offerPrice) : undefined,
      mainPrice: row.mainPrice != null ? Number(row.mainPrice) : undefined,
    };
  });
}
