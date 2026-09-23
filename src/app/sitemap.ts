import type { MetadataRoute } from 'next';
import { comPrazo } from '@/lib/db';
import { Product } from '@/lib/models';
import { paginasDoMapa, SITE_URL } from '@/lib/site';

/**
 * O mapa do sitio.
 *
 * O `robots.ts` ja o anunciava em `/sitemap.xml` e ele nao existia: no dia em
 * que o sitio ficasse indexavel, a primeira coisa que se dava aos motores de
 * busca era um 404.
 *
 * So entra o que existe e e publico. As paginas institucionais vem de
 * `paginas.ts`, onde uma pagina so conta quando existe; as privadas ficam de
 * fora pela mesma lista que o `robots.ts` bloqueia, para as duas nao poderem
 * discordar. Os produtos vem da base de dados; sem ela, o mapa sai sem eles
 * em vez de falhar.
 */

// Refaz-se de hora a hora: os produtos mudam sem o sitio ser publicado de novo.
export const revalidate = 3600;

async function produtos(): Promise<MetadataRoute.Sitemap> {
  try {
    const lista = await comPrazo(() =>
      Product.find({ active: true }).select('slug updatedAt').lean(),
    );
    return lista.map((p) => ({
      url: `${SITE_URL}/produto/${encodeURIComponent(p.slug)}`,
      lastModified: p.updatedAt,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginas = paginasDoMapa().map((caminho) => ({
    url: `${SITE_URL}${caminho === '/' ? '' : caminho}`,
  }));
  return [...paginas, ...(await produtos())];
}
