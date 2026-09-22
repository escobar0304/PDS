'use client';

import { ReactNode } from 'react';
import { CartProvider } from '@/contexts/CartContext';
import CartPreview from './cartPreview';
import SessionProvider from './SessionProvider';
import { IconContext } from '@phosphor-icons/react';

export default function ClientProviders({ children }: { children: ReactNode }) {
  // O traco fino e a decisao de desenho: os icones acompanham o peso do texto
  // em vez de competirem com ele, ao contrario do traco uniforme e grosso que
  // vinha por omissao.
  //
  // aria-hidden porque todos os icones do site sao decorativos: o que lhes
  // fica ao lado ja tem texto ou aria-label. Sem isto cada icone aparece na
  // arvore de acessibilidade como uma imagem sem nome.
  return (
    <IconContext.Provider
      value={{ weight: 'light', mirrored: false, 'aria-hidden': true }}
    >
      <SessionProvider>
        <CartProvider>
          {children}
          <CartPreview />
        </CartProvider>
      </SessionProvider>
    </IconContext.Provider>
  );
}
