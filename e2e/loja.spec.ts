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
