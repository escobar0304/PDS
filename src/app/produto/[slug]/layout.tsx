import type { Metadata } from 'next';
import { comPrazo } from '@/lib/db';
import { Product } from '@/lib/models';

/**
 * O titulo de uma peca e o nome da peca.
 *
 * A pagina e um componente de cliente e le o produto pela API depois de
 * carregar; os metadados tem de estar no HTML servido, e por isso le-se aqui,
 * no servidor. Sem isto o titulo era "Petalas de Sonho" em todos os produtos
 * — indistinguiveis num separador, num leitor de ecra (WCAG 2.4.2) e num
 * resultado de pesquisa.
 *
 * Com a base de dados em baixo ou lenta, fica "Produto": a pagina tem de
 * abrir na mesma, e `e2e/resiliencia.spec.ts` corre-a sem base de dados.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const canonico = { alternates: { canonical: `/produto/${encodeURIComponent(slug)}` } };

  try {
    // Com a base de dados lenta ou em baixo, o titulo nao pode segurar a
    // pagina: ao fim de dois segundos fica "Produto" e a pagina abre.
    const produto = await comPrazo(() =>
      Product.findOne({ slug, active: true }).select('name description').lean(),
    );
    if (!produto) return { title: 'Produto não encontrado' };
    return {
      title: produto.name,
      ...(produto.description && { description: produto.description.slice(0, 160) }),
      ...canonico,
    };
  } catch {
    return { title: 'Produto', ...canonico };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
