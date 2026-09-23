import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';
import { DESCRICAO_SITIO } from '@/lib/afirmacoes';
import { SITE_URL } from '@/lib/site';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

/**
 * O `template` e o que faz cada pagina ter titulo proprio. Ate aqui todas as
 * paginas do site partilhavam o titulo da raiz; agora basta uma pagina
 * exportar `metadata: { title: 'Loja' }` para ficar "Loja · Pétalas de Sonho".
 * As paginas sao anotadas a medida que sao construidas, nao de uma vez no fim.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Pétalas de Sonho',
    template: '%s · Pétalas de Sonho',
  },
  description:
    DESCRICAO_SITIO,
  authors: [{ name: 'Pétalas de Sonho' }],
  openGraph: {
    title: 'Pétalas de Sonho',
    description: DESCRICAO_SITIO,
    type: 'website',
    locale: 'pt_PT',
    siteName: 'Pétalas de Sonho',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* O icone vem de app/icon.svg pela convencao de ficheiro do Next. */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body>
        <a href="#conteudo" className="saltar-conteudo">
          Saltar para o conteúdo
        </a>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
