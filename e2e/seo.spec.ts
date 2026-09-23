import { expect, test } from '@playwright/test';

/**
 * O que os motores de busca leem. O sitio continua bloqueado no `robots.ts`
 * ate a camada legal estar completa; isto verifica que, no dia em que deixar
 * de estar, o que lhes chega esta certo.
 */

const PUBLICAS = ['/', '/loja', '/catalogo', '/sobre-nos', '/contacto', '/privacidade', '/cookies', '/faq'];

test('cada página pública declara o seu próprio endereço canónico', async ({ request }) => {
  for (const rota of PUBLICAS) {
    const html = await (await request.get(rota)).text();
    const canonico = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    expect(canonico, `${rota} sem canónico`).toBeDefined();
    // Um canonico na raiz herdado por todas as paginas diria a todas que sao
    // a pagina inicial.
    expect(new URL(canonico!).pathname.replace(/\/$/, '') || '/', rota).toBe(rota);
  }
});

test('a loja filtrada aponta para a loja', async ({ request }) => {
  const html = await (await request.get('/loja?categoria=ametistas')).text();
  expect(html).toMatch(/<link rel="canonical" href="[^"]+\/loja"/);
});

test('o mapa do sítio existe, e só lista o que é público e existe', async ({ request }) => {
  // O `robots.ts` anunciava-o e ele nao existia.
  const r = await request.get('/sitemap.xml');
  expect(r.status()).toBe(200);
  const caminhos = [...(await r.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => new URL(m[1]).pathname,
  );

  expect(caminhos).toContain('/');
  for (const c of caminhos) {
    expect(c, 'privada no mapa').not.toMatch(/^\/(api|admin|area-pessoal|auth|carrinho|sucesso|falha)/);
    const pagina = await request.get(c);
    expect(pagina.status(), `${c} está no mapa e não existe`).toBe(200);
  }
});

test('sem base de dados, o produto abre na mesma, com um título genérico', async ({ request }) => {
  // O titulo vem da base de dados, no servidor. Sem ela nao pode segurar a
  // pagina: este servidor corre sem MONGODB_URI de proposito.
  const inicio = Date.now();
  const r = await request.get('/produto/quartzo-rosa-bruto');
  expect(r.status()).toBe(200);
  expect(Date.now() - inicio).toBeLessThan(5000);
  expect(await r.text()).toContain('<title>Produto · Pétalas de Sonho</title>');
});
