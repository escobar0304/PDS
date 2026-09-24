import type { Page } from '@playwright/test';

/** Dados estaveis para os testes nao dependerem da base de dados. */
export const CATEGORIAS = [
  { _id: 'c1', name: 'Quartzos', slug: 'quartzos', description: 'Família do quartzo', order: 1 },
  { _id: 'c2', name: 'Ametistas', slug: 'ametistas', description: 'Tons de violeta', order: 2 },
];

export const PRODUTOS = [
  {
    _id: 'p1',
    name: 'Quartzo Rosa Bruto',
    slug: 'quartzo-rosa-bruto',
    description: 'Peça bruta de quartzo rosa.',
    priceCents: 2400,
    images: [],
    stock: 3,
    categoryId: { _id: 'c1', name: 'Quartzos', slug: 'quartzos' },
    featured: true,
    active: true,
  },
  {
    _id: 'p2',
    name: 'Ametista Polida',
    slug: 'ametista-polida',
    description: 'Ametista polida à mão.',
    priceCents: 4250,
    images: [],
    stock: 10,
    categoryId: { _id: 'c2', name: 'Ametistas', slug: 'ametistas' },
    featured: false,
    active: true,
  },
  {
    _id: 'p3',
    name: 'Citrino Esgotado',
    slug: 'citrino-esgotado',
    description: 'Sem stock de momento.',
    priceCents: 1800,
    images: [],
    stock: 0,
    categoryId: { _id: 'c1', name: 'Quartzos', slug: 'quartzos' },
    featured: false,
    active: true,
  },
];

type Cenario = {
  produtos?: unknown[];
  categorias?: unknown[];
  /** Devolve 500 nestes recursos, para exercitar os estados de erro. */
  falhar?: Array<'produtos' | 'categorias'>;
};

const json = (body: unknown, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

/** Intercepta as rotas de dados. Chamar antes de page.goto. */
export async function mockApi(page: Page, cenario: Cenario = {}) {
  const {
    produtos = PRODUTOS,
    categorias = CATEGORIAS,
    falhar = [],
  } = cenario;

  await page.route(
    (url) => url.pathname === '/api/categories',
    (route) =>
      route.fulfill(
        falhar.includes('categorias')
          ? json({ error: 'Erro ao buscar categorias' }, 500)
          : json(categorias)
      )
  );

  await page.route(
    (url) => url.pathname === '/api/products',
    (route) => {
      if (falhar.includes('produtos')) {
        return route.fulfill(json({ error: 'Erro ao buscar produtos' }, 500));
      }
      const categoria = new URL(route.request().url()).searchParams.get('category');
      const lista = categoria
        ? (produtos as typeof PRODUTOS).filter(
            (p) => p.categoryId?.slug === categoria || p.categoryId?._id === categoria
          )
        : produtos;
      return route.fulfill(json(lista));
    }
  );

  await page.route(
    (url) => url.pathname.startsWith('/api/products/'),
    (route) => {
      const slug = new URL(route.request().url()).pathname.split('/').pop();
      const produto = (produtos as typeof PRODUTOS).find((p) => p.slug === slug);
      return route.fulfill(
        produto ? json(produto) : json({ error: 'Produto não encontrado' }, 404)
      );
    }
  );
}

/** Recolhe erros de JavaScript. Falhas de rede da API nao contam. */
export function recolherErrosDeJs(page: Page): string[] {
  const erros: string[] = [];
  page.on('pageerror', (err) => erros.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const texto = msg.text();
    if (/is not a function|undefined is not|Cannot read propert/i.test(texto)) {
      erros.push(texto);
    }
  });
  return erros;
}
