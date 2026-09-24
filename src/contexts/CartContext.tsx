'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  addItem as addItemTo,
  cartTotal,
  countItems,
  parseStoredCart,
  removeItem as removeItemFrom,
  setQuantity,
  type CartItem,
  type CartProduct,
} from '@/lib/cart';

export type { CartItem } from '@/lib/cart';

const STORAGE_KEY = 'cart';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (product: CartProduct, quantity?: number) => void;
  /** `chave` e `chaveDe(item)`: o produto e a medida. */
  removeItem: (chave: string) => void;
  updateQuantity: (chave: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      // Excepcao consciente a `set-state-in-effect`. O carrinho so pode ser
      // lido depois de hidratar: le-lo no primeiro render dava HTML diferente
      // no servidor e no browser. E e estado que a pessoa altera, por isso
      // nao cabe em `useSyncExternalStore` sem reescrever o contexto todo.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(parseStoredCart(localStorage.getItem(STORAGE_KEY)));
    } catch {
      // localStorage pode estar indisponivel (modo privado, cookies bloqueados)
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Nao escrever antes de ler, senao o primeiro render apaga o carrinho guardado
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // sem persistencia disponivel, o carrinho vive so nesta sessao
    }
  }, [items, hydrated]);

  const addItem = (product: CartProduct, quantity = 1) => {
    setItems((prev) => addItemTo(prev, product, quantity));
    setIsOpen(true);
  };

  const removeItem = (chave: string) => {
    setItems((prev) => removeItemFrom(prev, chave));
  };

  const updateQuantity = (chave: string, quantity: number) => {
    setItems((prev) => setQuantity(prev, chave, quantity));
  };

  const clearCart = () => setItems([]);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount: countItems(items),
        total: cartTotal(items),
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de CartProvider');
  }
  return context;
}
