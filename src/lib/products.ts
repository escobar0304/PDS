// src/lib/products.ts
//
// Vive fora do ficheiro de rota porque o App Router so permite exportar
// handlers HTTP a partir de route.ts.

export const SORT_KEYS = [
  'featured',
  'price-asc',
  'price-desc',
  'name-asc',
  'name-desc',
  'newest',
] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export const SORTS: Record<SortKey, Record<string, 1 | -1>> = {
  featured: { featured: -1, createdAt: -1 },
  'price-asc': { priceCents: 1 },
  'price-desc': { priceCents: -1 },
  'name-asc': { name: 1 },
  'name-desc': { name: -1 },
  newest: { createdAt: -1 },
};

export function resolveSort(value: string | null | undefined) {
  return SORTS[(value ?? '') as SortKey] ?? SORTS.featured;
}

/** Normaliza o limite pedido pelo cliente. */
export function resolveLimit(value: string | null | undefined): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return Math.min(n, 100);
}
