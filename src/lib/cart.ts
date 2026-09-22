// src/lib/cart.ts
//
// Logica pura do carrinho, separada do contexto React para poder ser testada
// sem montar componentes.

export interface CartItem {
  _id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
}

export type CartProduct = Omit<CartItem, 'quantity'>;

/** Mantem a quantidade entre 1 e o stock disponivel. */
export function clampQuantity(quantity: number, stock: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.min(Math.floor(quantity), Math.max(0, stock)));
}

export function addItem(
  items: CartItem[],
  product: CartProduct,
  quantity = 1
): CartItem[] {
  if (product.stock <= 0) return items;

  const existing = items.find((item) => item._id === product._id);

  if (!existing) {
    return [...items, { ...product, quantity: clampQuantity(quantity, product.stock) }];
  }

  return items.map((item) =>
    item._id === product._id
      ? { ...item, quantity: clampQuantity(item.quantity + quantity, item.stock) }
      : item
  );
}

export function removeItem(items: CartItem[], productId: string): CartItem[] {
  return items.filter((item) => item._id !== productId);
}

export function setQuantity(
  items: CartItem[],
  productId: string,
  quantity: number
): CartItem[] {
  if (quantity <= 0) return removeItem(items, productId);

  return items.map((item) =>
    item._id === productId
      ? { ...item, quantity: clampQuantity(quantity, item.stock) }
      : item
  );
}

export function countItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/** Descarta o que nao tem a forma esperada, para o localStorage nao partir a app. */
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        !!item &&
        typeof item._id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.slug === 'string' &&
        typeof item.price === 'number' &&
        typeof item.quantity === 'number' &&
        typeof item.stock === 'number'
    );
  } catch {
    return [];
  }
}
