import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ANEL, PRODUTOS, mockApi } from './fixtures/api';

/**
 * Acessibilidade verificada contra a pagina a correr, nao contra o codigo.
 *
 * O `axe` apanha o que e mecanico — contraste, etiquetas, nomes acessiveis,
 * estrutura. Nao apanha ordem de foco, armadilhas de foco, area de toque nem
 * se a ligacao de salto chega mesmo ao conteudo. Esses estao aqui a seguir,
 * porque foi onde estava o trabalho que faltava.
 */

const ROTAS = [
  '/',
  '/loja',
  '/catalogo',
  '/sobre-nos',
  '/carrinho',
  '/auth/login',
  '/auth/register',
  '/cookies',
  '/privacidade',
  '/contacto',
  '/termos',
  '/envios',
];

const NORMAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

for (const rota of ROTAS) {
  test(`${rota} não tem violações WCAG 2.1 AA`, async ({ page }) => {
    await mockApi(page);
    await page.goto(rota);
    await page.waitForTimeout(400);

    const r = await new AxeBuilder({ page }).withTags(NORMAS).analyze();

    expect(
      r.violations.map((v) => `[${v.impact}] ${v.id}: ${v.nodes[0]?.html.slice(0, 80)}`),
      rota,
    ).toEqual([]);
  });
}

test('a escolha da medida não tem violações, e faz-se só com o teclado', async ({ page }) => {
  await mockApi(page, { produtos: [...PRODUTOS, ANEL] });
  await page.goto('/produto/anel-de-ametista');
  await page.waitForTimeout(400);

  const r = await new AxeBuilder({ page }).withTags(NORMAS).analyze();
  expect(r.violations.map((v) => `[${v.impact}] ${v.id}: ${v.nodes[0]?.html.slice(0, 80)}`)).toEqual([]);

  // Radios verdadeiros: o foco entra na opcao disponivel, o espaco escolhe.
  // A medida esgotada salta-se sozinha, porque esta desativada.
  await page.getByRole('radio', { name: '16' }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('radio', { name: '16' })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Adicionar ao Carrinho', exact: true })).toBeEnabled();

  // E cada opcao tem pelo menos 24x24 (2.5.8): o alvo e a etiqueta.
  const caixas = await page.locator('fieldset label').evaluateAll((els) =>
    els.map((e) => e.getBoundingClientRect()).map((c) => [c.width, c.height])
  );
  for (const [w, h] of caixas) {
    expect(w).toBeGreaterThanOrEqual(24);
    expect(h).toBeGreaterThanOrEqual(24);
  }
});

test('a ligação de salto é o primeiro foco e leva mesmo ao conteúdo', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar para o conteúdo' })).toBeFocused();

  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');

  // O que interessa nao e o destino existir: e o foco seguinte cair la dentro.
  const dentro = await page.evaluate(() => !!document.activeElement?.closest('main'));
  expect(dentro, 'depois do salto, o foco devia estar dentro do conteúdo').toBe(true);
});

test.describe('alvos de toque', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('nenhum controlo fica abaixo de 24 por 24', async ({ page }) => {
    // Criterio 2.5.8 da WCAG 2.2, nivel AA. Os 44x44 sao AAA na 2.1 e nao se
    // aplicam a tudo: aplicar 44 as ligacoes do rodape deixava-o absurdo. A
    // norma isenta explicitamente ligacoes dentro de uma frase, e a isencao
    // esta replicada abaixo.
    for (const rota of ROTAS) {
      await mockApi(page);
      await page.goto(rota);
      await page.waitForTimeout(400);

      const pequenos = await page.evaluate(() =>
        [...document.querySelectorAll('a[href],button,select,textarea,[role=switch]')]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            if (!r.width || !r.height) return false;
            if (r.width >= 24 && r.height >= 24) return false;

            const pai = e.parentElement;
            const inline =
              e.tagName === 'A' &&
              pai &&
              /^(P|LI|SPAN|TD|H[1-6])$/.test(pai.tagName) &&
              (pai.textContent ?? '').trim().length > (e.textContent ?? '').trim().length + 8;
            return !inline;
          })
          .map((e) => {
            const r = e.getBoundingClientRect();
            const nome = (e.textContent || e.getAttribute('aria-label') || '').trim();
            return `${Math.round(r.width)}x${Math.round(r.height)} "${nome.slice(0, 30)}"`;
          }),
      );

      expect(pequenos, rota).toEqual([]);
    }
  });
});

test('o painel do carrinho devolve o foco a quem o abriu', async ({ page }) => {
  await mockApi(page);
  await page.goto('/loja');

  const icone = page.getByRole('banner').getByLabel('Carrinho de Compras');
  await icone.click();

  const painel = page.getByRole('dialog', { name: /carrinho/i });
  await expect(painel).toBeVisible();
  await expect(painel.getByRole('button', { name: 'Fechar carrinho' })).toBeFocused();

  await page.keyboard.press('Escape');

  await expect(painel).toBeHidden();
  await expect(icone, 'sem isto, quem navega por teclado fica perdido').toBeFocused();
});

test('as ligações em texto corrido não dependem só da cor', async ({ page }) => {
  // WCAG 1.4.1: quem nao separa bem os tons nao ve ali uma ligacao.
  await page.goto('/cookies');

  const ligacoes = page.getByRole('main').locator('p a[href^="/"]');
  const n = await ligacoes.count();
  expect(n).toBeGreaterThan(0);

  for (let i = 0; i < n; i += 1) {
    const decoracao = await ligacoes.nth(i).evaluate(
      (e) => getComputedStyle(e).textDecorationLine,
    );
    expect(decoracao, 'ligação em texto sem sublinhado em repouso').toContain('underline');
  }
});

/**
 * 2.4.2 Page Titled (nivel A): o titulo diz de que pagina se trata.
 *
 * Oito paginas tinham o mesmo, "Petalas de Sonho" — num separador, no
 * historico ou num leitor de ecra, indistinguiveis. O `axe` nao o apanha: a
 * regra `document-title` so verifica que o titulo existe.
 */
test('cada página tem um título seu', async ({ request }) => {
  const rotas = [
    '/',
    '/loja',
    '/catalogo',
    '/sobre-nos',
    '/contacto',
    '/privacidade',
    '/cookies',
    '/faq',
    '/termos',
    '/envios',
    '/carrinho',
    // Sem '/area-pessoal': sem sessao, o servidor redireciona para a entrada
    // antes de haver pagina (ver `autenticacao.spec.ts`), e o que se leria
    // aqui era o titulo de '/auth/login'.
    '/auth/login',
    '/auth/register',
    '/auth/recuperar-password',
  ];
  const titulos = new Map<string, string>();
  for (const rota of rotas) {
    const html = await (await request.get(rota)).text();
    const titulo = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
    expect(titulo, `${rota} sem título`).not.toBe('');
    titulos.set(rota, titulo);
  }

  const repetidos = [...titulos].filter(
    ([rota, t]) => [...titulos].some(([outra, u]) => outra !== rota && u === t),
  );
  expect(repetidos, 'páginas com o mesmo título').toEqual([]);
});
