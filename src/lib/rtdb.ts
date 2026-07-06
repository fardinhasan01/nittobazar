export const snapshotToArray = <T extends Record<string, unknown>>(
  value: unknown
): Array<T & { id: string }> => {
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value as Record<string, unknown>).map(([id, item]) => ({
    id,
    ...(item as T),
  }));
};

export const normalizeString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

export const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

export const sanitizeDatabaseValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return undefined;

  if (typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeDatabaseValue(item))
      .filter((item) => item !== undefined);
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
      const sanitized = sanitizeDatabaseValue(entryValue);
      if (sanitized !== undefined) {
        output[key] = sanitized;
      }
    }
    return output;
  }

  return undefined;
};
