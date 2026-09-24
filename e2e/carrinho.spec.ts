import { expect, test } from '@playwright/test';
import { ANEL, PRODUTOS, mockApi } from './fixtures/api';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

const contador = (page: import('@playwright/test').Page) =>
  page.getByRole('banner').locator('[aria-label="Carrinho de Compras"] span');

test('adicionar da loja abre o painel e conta a unidade', async ({ page }) => {
  await page.goto('/loja');

  await page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: 'Quartzo Rosa Bruto' }) })
    .last()
    .getByRole('button', { name: 'Adicionar ao carrinho' })
    .click();

  await expect(page.getByRole('heading', { name: /Carrinho \(1\)/ })).toBeVisible();
  await expect(contador(page)).toHaveText('1');
});

test('a quantidade nunca passa o stock disponível', async ({ page }) => {
  await page.goto('/produto/quartzo-rosa-bruto');

  // stock = 3, portanto o botao de aumentar tem de parar aos 3
  for (let i = 0; i < 6; i++) {
    const mais = page.getByRole('button', { name: 'Aumentar quantidade' });
    if (await mais.isDisabled()) break;
    await mais.click();
  }

  await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled();
  await page.getByRole('button', { name: 'Adicionar ao Carrinho', exact: true }).click();
  await expect(contador(page)).toHaveText('3');
});

test('o carrinho sobrevive a recarregar a página', async ({ page }) => {
  await page.goto('/produto/ametista-polida');
  await page.getByRole('button', { name: 'Adicionar ao Carrinho', exact: true }).click();
  await expect(contador(page)).toHaveText('1');

  await page.reload();

  await expect(contador(page)).toHaveText('1');
});

test('dados corrompidos no armazenamento não rebentam o site', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('cart', '{isto não é json'));
  await page.reload();

  await expect(page.getByText('Alguma coisa correu mal')).toHaveCount(0);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('a página do carrinho soma, altera quantidades e remove', async ({ page }) => {
  await page.goto('/produto/ametista-polida');
  await page.getByRole('button', { name: 'Adicionar ao Carrinho', exact: true }).click();
  await page.goto('/carrinho');

  await expect(page.getByText('42,50\u00a0€').first()).toBeVisible();

  await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await expect(page.getByText('85,00\u00a0€').first()).toBeVisible();

  await page.getByRole('button', { name: 'Remover item' }).click();
  await expect(page.getByRole('heading', { name: 'Carrinho Vazio' })).toBeVisible();
});

test('o carrinho vazio convida a ir à loja', async ({ page }) => {
  await page.goto('/carrinho');

  await expect(page.getByRole('heading', { name: 'Carrinho Vazio' })).toBeVisible();
  await page.getByRole('link', { name: 'Ir às Compras' }).click();
  await expect(page).toHaveURL(/\/loja$/);
});

// O checkout e da v2. Ate la, o botao principal do carrinho levava a
// /checkout, que nao existe — este teste era um `fixme` a lembra-lo. Agora
// verifica o contrario: que o carrinho diz a verdade e leva a um sitio que
// existe. Quando o checkout chegar, este teste muda com ele.
test('sem checkout, o carrinho diz que não aceita encomendas e leva ao contacto', async ({ page }) => {
  await page.goto('/produto/ametista-polida');
  await page.getByRole('button', { name: 'Adicionar ao Carrinho', exact: true }).click();
  await page.goto('/carrinho');

  await expect(page.getByText('A loja online ainda não aceita encomendas')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Finalizar Compra' })).toHaveCount(0);
  await expect(page.locator('a[href="/checkout"]')).toHaveCount(0);

  await page.getByRole('link', { name: 'Falar connosco' }).click();
  await expect(page).toHaveURL(/\/contacto$/);
});

test('o ícone do cabeçalho abre o painel do carrinho sem sair da página', async ({ page }) => {
  await mockApi(page);
  await page.goto('/loja');

  await page
    .getByRole('article')
    .first()
    .getByRole('button', { name: 'Adicionar ao carrinho' })
    .click();

  const painel = page.getByRole('dialog', { name: /carrinho/i });
  await painel.getByRole('button', { name: /fechar/i }).click();
  await expect(painel).toBeHidden();

  await page.getByRole('banner').getByLabel('Carrinho de Compras').click();

  await expect(painel).toBeVisible();
  await expect(page).toHaveURL(/\/loja/);
});

test('um anel escolhe-se pela medida, e a medida esgotada não se escolhe', async ({ page }) => {
  await mockApi(page, { produtos: [...PRODUTOS, ANEL] });
  await page.goto('/produto/anel-de-ametista');

  // Sem medida escolhida nao ha nada para adicionar: o servidor tambem nao
  // escolhe por ninguem.
  const adicionar = page.getByRole('button', { name: 'Escolha a medida' });
  await expect(adicionar).toBeDisabled();

  const medidas = page.getByRole('group', { name: 'Medida' });
  await expect(medidas.getByRole('radio', { name: /14/ })).toBeDisabled();
  await medidas.getByRole('radio', { name: '16' }).check({ force: true });

  await page.getByRole('button', { name: 'Adicionar ao Carrinho', exact: true }).click();
  await expect(contador(page)).toHaveText('1');

  await page.goto('/carrinho');
  await expect(page.getByText('Medida 16')).toBeVisible();
});

test('na loja, um anel leva à escolha da medida em vez de ir para o carrinho', async ({ page }) => {
  await mockApi(page, { produtos: [...PRODUTOS, ANEL] });
  await page.goto('/loja');

  await page.getByRole('link', { name: 'Escolher a medida de Anel de Ametista' }).click();
  await expect(page).toHaveURL(/\/produto\/anel-de-ametista$/);
});
