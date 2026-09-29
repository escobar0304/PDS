import type { Metadata } from 'next';
import { Cormorant_Garamond, Figtree, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';
import { DESCRICAO_SITIO } from '@/lib/afirmacoes';
import { SITE_URL } from '@/lib/site';

/**
 * Tres letras, cada uma com um trabalho (docs/MARCA.md):
 * - exposicao: os titulos, como as etiquetas de um gabinete de mineralogia;
 * - corpo: tudo o que se le, incluindo o texto legal;
 * - etiqueta: os dados de cada peca (familia, peso, medida), em monoespaco.
 * So os pesos que se usam, para nao pesar no carregamento.
 */
const exposicao = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-exposicao',
  display: 'swap',
});
const corpo = Figtree({ subsets: ['latin'], variable: '--font-corpo', display: 'swap' });
const etiqueta = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-etiqueta', display: 'swap' });

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
    <html lang="pt-PT" className={`${exposicao.variable} ${corpo.variable} ${etiqueta.variable}`}>
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
