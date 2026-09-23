import type { Metadata } from 'next';

/**
 * A pagina e um componente de cliente e nao pode declarar metadados; este
 * layout existe so para isso. Sem ele, o titulo era "Petalas de Sonho" como
 * em mais sete paginas — e o criterio 2.4.2 da WCAG (nivel A) pede um
 * titulo que diga de que pagina se trata. Ver `docs/ACESSIBILIDADE.md`.
 */
export const metadata: Metadata = {
  title: 'Catálogo',
  alternates: { canonical: '/catalogo' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
