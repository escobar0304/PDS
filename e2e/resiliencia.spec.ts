import { expect, test } from '@playwright/test';
import { mockApi, recolherErrosDeJs } from './fixtures/api';

/**
 * O site tem de aguentar a base de dados em baixo e a API a devolver erro.
 * O servidor destes testes corre sem MONGODB_URI de proposito.
 */

const ROTAS = [
  { path: '/', h1: /Explore os Nossos/i },
  { path: '/loja', h1: /^Loja$/i },
  { path: '/catalogo', h1: /Catálogo/i },
  { path: '/sobre-nos', h1: /Sobre Nós/i },
  { path: '/carrinho', h1: /Carrinho/i },
  { path: '/auth/login', h1: /Bem-vindo de volta/i },
  { path: '/auth/register', h1: /Criar Conta/i },
  { path: '/rota-que-nao-existe', h1: /não encontrámos/i },
];

for (const rota of ROTAS) {
  test(`${rota.path} renderiza com a base de dados em baixo`, async ({ page }) => {
    const erros = recolherErrosDeJs(page);

    await page.goto(rota.path);

    await expect(
      page.getByText('Alguma coisa correu mal'),
      'a página caiu no limite de erro'
    ).toHaveCount(0);
    await expect(page.locator('h1').first()).toContainText(rota.h1);
    expect(erros, `erros de JavaScript em ${rota.path}`).toEqual([]);
  });
}

test('a loja mostra erro, e não "sem produtos", quando a API falha', async ({ page }) => {
  const erros = recolherErrosDeJs(page);
  await mockApi(page, { falhar: ['produtos', 'categorias'] });

  await page.goto('/loja');

  // Um erro de servidor nao pode ser apresentado como catalogo vazio: leva o
  // cliente a pensar que a loja nao tem nada para vender.
  await expect(page.getByRole('main').getByRole('alert')).toBeVisible();
  await expect(page.getByText('Nenhum produto encontrado')).toHaveCount(0);
  expect(erros).toEqual([]);
});

test('o catálogo mostra erro quando a API falha', async ({ page }) => {
  const erros = recolherErrosDeJs(page);
  await mockApi(page, { falhar: ['categorias'] });

  await page.goto('/catalogo');

  await expect(page.getByRole('main').getByRole('alert')).toBeVisible();
  expect(erros).toEqual([]);
});

test('a loja distingue catálogo vazio de erro', async ({ page }) => {
  await mockApi(page, { produtos: [], categorias: [] });

  await page.goto('/loja');

  await expect(page.getByText('Nenhum produto encontrado')).toBeVisible();
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
});

test('um produto inexistente não rebenta a página', async ({ page }) => {
  const erros = recolherErrosDeJs(page);
  await mockApi(page);

  await page.goto('/produto/nao-existe');

  await expect(page.getByText('Produto não encontrado')).toBeVisible();
  expect(erros).toEqual([]);
});
