import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/contexts/CartContext';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pétalas de Sonho - Pedras Preciosas e Cristais',
  description: 'Descubra pedras preciosas e cristais para a sua jornada espiritual. Qualidade, autenticidade e energia em cada peça.',
  keywords: ['pedras preciosas', 'cristais', 'astrologia', 'energia', 'espiritualidade'],
  authors: [{ name: 'Pétalas de Sonho' }],
  openGraph: {
    title: 'Pétalas de Sonho - Pedras Preciosas e Cristais',
    description: 'Descubra pedras preciosas e cristais para a sua jornada espiritual.',
    type: 'website',
    locale: 'pt_PT',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={inter.className}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}