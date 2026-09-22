import { expect, test } from '@playwright/test';
import { mockApi } from './fixtures/api';

/**
 * O inventario de cookies da pagina /cookies so vale enquanto for verdade.
 *
 * Estes testes sao a rede: falham no dia em que alguem acrescentar um script
 * de analise, um tipo de letra de um CDN ou outro mapa, e obrigam a atualizar
 * a pagina antes de a alteracao chegar a producao.
 */

const ROTAS_PUBLICAS = ['/', '/loja', '/catalogo', '/sobre-nos', '/carrinho', '/auth/login', '/cookies'];

/** Dominios que o site pode contactar sem a pessoa ter pedido nada. */
const PERMITIDOS = ['localhost', '127.0.0.1'];

test('nenhuma página contacta terceiros sem a pessoa pedir', async ({ page, context }) => {
  const externos = new Set<string>();
  context.on('request', (req) => {
    const anfitriao = new URL(req.url()).hostname;
    if (!PERMITIDOS.includes(anfitriao)) externos.add(anfitriao);
  });

  await mockApi(page);

  for (const rota of ROTAS_PUBLICAS) {
    await page.goto(rota);
    await page.waitForTimeout(600);
  }

  expect(
    [...externos],
    'um terceiro novo obriga a rever /cookies e, possivelmente, a pedir consentimento',
  ).toEqual([]);
});

test('o mapa só contacta a Google depois de carregar no botão', async ({ page, context }) => {
  const pedidosGoogle: string[] = [];
  context.on('request', (req) => {
    if (new URL(req.url()).hostname.endsWith('google.com')) pedidosGoogle.push(req.url());
  });

  await page.goto('/sobre-nos');
  await page.waitForTimeout(800);

  expect(pedidosGoogle, 'o mapa não pode carregar sozinho').toEqual([]);
  await expect(page.getByRole('button', { name: 'Carregar o mapa' })).toBeVisible();

  await page.getByRole('button', { name: 'Carregar o mapa' }).click();

  await expect(page.locator('iframe[title*="Localização"]')).toBeVisible();
});

test('a escolha do mapa não é guardada entre visitas', async ({ page }) => {
  await page.goto('/sobre-nos');
  await page.getByRole('button', { name: 'Carregar o mapa' }).click();
  await expect(page.locator('iframe[title*="Localização"]')).toBeVisible();

  // Guardar a escolha exigiria consentimento informado e forma de o retirar.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Carregar o mapa' })).toBeVisible();
});

test('o site só guarda o que a página /cookies declara', async ({ page, context }) => {
  const declarados = ['next-auth.csrf-token', 'next-auth.callback-url', 'next-auth.session-token'];
  const declaradosLocal = ['cart', 'nextauth.message'];

  await mockApi(page);
  for (const rota of ROTAS_PUBLICAS) {
    await page.goto(rota);
  }

  const cookies = await context.cookies();
  const naoDeclarados = cookies.map((c) => c.name).filter((n) => !declarados.includes(n));
  expect(naoDeclarados, 'cookie não declarado em /cookies').toEqual([]);

  const chaves = await page.evaluate(() => Object.keys(localStorage));
  expect(
    chaves.filter((k) => !declaradosLocal.includes(k)),
    'chave de armazenamento local não declarada em /cookies',
  ).toEqual([]);
});

test('a página de cookies está ligada a partir do rodapé', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('contentinfo').getByRole('link', { name: 'Cookies' }).click();

  await expect(page).toHaveURL(/\/cookies$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Cookies');
});
