'use client';

import { ReactNode } from 'react';
import { CartProvider } from '@/contexts/CartContext';
import CartPreview from './cartPreview';
import SessionProvider from './SessionProvider';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <CartPreview />
      </CartProvider>
    </SessionProvider>
  );
}
