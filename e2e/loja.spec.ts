import { expect, test } from '@playwright/test';
import { mockApi, PRODUTOS } from './fixtures/api';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('a grelha mostra os produtos devolvidos pela API', async ({ page }) => {
  await page.goto('/loja');

  for (const produto of PRODUTOS) {
    await expect(page.getByRole('heading', { name: produto.name })).toBeVisible();
  }
  await expect(page.getByText(`${PRODUTOS.length} produtos encontrados`)).toBeVisible();
});

test('a pesquisa filtra no cliente', async ({ page }) => {
  await page.goto('/loja');

  await page.getByLabel('Pesquisar').fill('ametista');

  await expect(page.getByRole('heading', { name: 'Ametista Polida' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Quartzo Rosa Bruto' })).toHaveCount(0);
  await expect(page.getByText('1 produto encontrado')).toBeVisible();
});

test('a pesquisa sem resultados mostra estado vazio e deixa limpar', async ({ page }) => {
  await page.goto('/loja');

  await page.getByLabel('Pesquisar').fill('zzzz');
  await expect(page.getByText('Nenhum produto encontrado')).toBeVisible();

  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(page.getByRole('heading', { name: 'Quartzo Rosa Bruto' })).toBeVisible();
});

test('escolher categoria pede a categoria certa ao servidor', async ({ page }) => {
  await page.goto('/loja');

  const pedido = page.waitForRequest(
    (r) => r.url().includes('/api/products') && r.url().includes('category=ametistas')
  );
  await page.getByRole('button', { name: 'Ametistas' }).click();
  await pedido;

  await expect(page.getByRole('heading', { name: 'Ametista Polida' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Quartzo Rosa Bruto' })).toHaveCount(0);
});

test('a ordenação chega ao servidor com a chave que o servidor conhece', async ({ page }) => {
  await page.goto('/loja');

  const pedido = page.waitForRequest(
    (r) => r.url().includes('/api/products') && r.url().includes('sort=price-asc')
  );
  await page.getByRole('combobox').selectOption('price-asc');
  await pedido;
});

test('a categoria vinda do endereço é aplicada ao abrir', async ({ page }) => {
  await page.goto('/loja?categoria=ametistas');

  await expect(page.getByRole('heading', { name: 'Ametista Polida' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Quartzo Rosa Bruto' })).toHaveCount(0);
});

test('um produto esgotado não pode ser adicionado', async ({ page }) => {
  await page.goto('/loja');

  const cartao = page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: 'Citrino Esgotado' }) })
    .last();

  await expect(cartao.getByText('Esgotado')).toBeVisible();
  await expect(
    cartao.getByRole('button', { name: 'Adicionar ao carrinho' })
  ).toBeDisabled();
});

test('uma resposta atrasada não se sobrepõe à categoria escolhida depois', async ({ page }) => {
  // Os quartzos respondem devagar; as ametistas, logo. Escolher quartzos e
  // logo a seguir ametistas: a resposta dos quartzos chega em ultimo, e sem
  // guarda era ela que ficava na grelha — com o botao das ametistas marcado.
  await page.route(
    (url) => url.pathname === '/api/products' && url.searchParams.get('category') === 'quartzos',
    async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.fallback();
    },
  );

  await page.goto('/loja');
  await expect(page.getByRole('heading', { name: 'Ametista Polida' })).toBeVisible();

  await page.getByRole('button', { name: 'Quartzos' }).click();
  await page.getByRole('button', { name: 'Ametistas' }).click();
  await page.waitForTimeout(2500);

  await expect(page.getByRole('heading', { name: 'Ametista Polida' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Quartzo Rosa Bruto' })).toHaveCount(0);
});

/**
 * Isto nao foi um defeito. Eu disse que era — que a quantidade passava de um
 * produto para o relacionado — e acrescentei uma `key` para o resolver. O
 * teste passou tambem contra o codigo antigo: o App Router ja remonta a pagina
 * quando o `slug` muda. A `key` saiu; o teste fica, porque deixa de ser
 * verdade no dia em que o produto passar para um layout partilhado.
 */
test('abrir um produto relacionado começa do zero, não herda a quantidade', async ({ page }) => {
  const fumado = {
    ...PRODUTOS[0],
    _id: 'p4',
    name: 'Quartzo Fumado',
    slug: 'quartzo-fumado',
    stock: 5,
  };
  await mockApi(page, { produtos: [...PRODUTOS, fumado] });

  await page.goto('/produto/quartzo-rosa-bruto');
  const quantidade = page
    .getByRole('button', { name: 'Diminuir quantidade' })
    .locator('xpath=following-sibling::span[1]');
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await expect(quantidade).toHaveText('3');

  await page.getByRole('link', { name: 'Quartzo Fumado' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Quartzo Fumado' })).toBeVisible();
  await expect(quantidade).toHaveText('1');
});
