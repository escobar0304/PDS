import { expect, test, type Page } from '@playwright/test';
import { iniciarSessao } from '../e2e/fixtures/sessao';
import { ADMIN_ID, BASE, CLIENTE_ID } from './contas';

/**
 * O painel de gestao a funcionar, contra uma base de dados a serio.
 *
 * O que `e2e/painel.spec.ts` nao podia provar sem base de dados: que os
 * formularios criam de facto categorias e produtos, que um movimento muda o
 * stock, que a loja mostra o que o painel gravou, e que as regras do
 * servidor (peca unica, papel da conta) valem de ponta a ponta.
 */

// Cada execucao com nomes seus: nada depende da ordem nem do que ficou antes.
const sufixo = Date.now().toString(36);

async function criarCategoria(page: Page, nome: string, pecasUnicas: boolean) {
  await page.goto('/admin/categorias');
  const nova = page.locator('div', { has: page.getByRole('heading', { name: 'Nova categoria' }) }).last();
  await nova.getByLabel('Nome da categoria nova').fill(nome);
  const caixa = nova.getByLabel('Peças únicas');
  if (pecasUnicas) await caixa.check();
  else await caixa.uncheck();
  await nova.getByRole('button', { name: 'Criar categoria' }).click();
  await expect(nova.getByRole('status')).toHaveText('Guardado.');
  await expect(page.getByLabel(`Nome de ${nome}`)).toBeVisible();
}

test.describe('com a conta de administrador', () => {
  test.beforeEach(async ({ context }) => iniciarSessao(context, 'ADMIN', { base: BASE, userId: ADMIN_ID }));

  test('um anel com duas medidas: criar, vender ao balcão, e a loja mostra-o', async ({ page }) => {
    const categoria = `Anéis ${sufixo}`;
    const nome = `Anel ${sufixo}`;
    const slug = `anel-${sufixo}`;

    await criarCategoria(page, categoria, false);

    await page.goto('/admin/produtos/novo');
    await page.getByLabel('Categoria').selectOption({ label: `${categoria} (com medidas)` });
    await page.getByLabel('Nome', { exact: true }).fill(nome);
    await expect(page.getByLabel('Endereço')).toHaveValue(slug);
    await page.getByLabel('Preço, com IVA').fill('35,00');
    await page.getByLabel('Peso, em gramas').fill('10');
    await page.getByLabel('Medida 1', { exact: true }).fill('14');
    await page.getByLabel('Stock da medida 1').fill('2');
    await page.getByRole('button', { name: 'Acrescentar medida' }).click();
    await page.getByLabel('Medida 2', { exact: true }).fill('16');
    await page.getByLabel('Stock da medida 2').fill('0');
    await page.getByRole('button', { name: 'Criar produto' }).click();

    await expect(page).toHaveURL(/\/admin\/produtos\/[a-f0-9]{24}$/);
    await expect(page.getByRole('heading', { level: 1, name: nome })).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'Medida 14:' })).toContainText('2');

    // O stock inicial entrou como movimento, e nao do nada.
    const historico = page.getByRole('table', { name: /últimos movimentos/ });
    await expect(historico).toContainText('entrada');
    await expect(historico).toContainText('+2');

    // Uma venda ao balcao, pelo formulario de movimentos.
    await page.getByRole('combobox', { name: 'Medida' }).selectOption({ label: '14' });
    await page.getByLabel('O que aconteceu').selectOption({ label: 'Vendido na loja' });
    await page.getByLabel('Quantas unidades').fill('1');
    await page.getByRole('button', { name: 'Registar movimento' }).click();
    await expect(page.getByText('Registado. Fica com 1 em stock.')).toBeVisible();
    await expect(historico).toContainText('vendido na loja');

    // A loja le o que o painel gravou: o 16 esgotado, o 14 escolhivel.
    await page.goto(`/produto/${slug}`);
    await expect(page.getByRole('heading', { level: 1, name: nome })).toBeVisible();
    const medidas = page.getByRole('group', { name: 'Medida' });
    await expect(medidas.getByRole('radio', { name: /16/ })).toBeDisabled();
    await expect(medidas.getByRole('radio', { name: '14' })).toBeEnabled();
    await expect(page.getByText('35,00 €').first()).toBeVisible();

    // E a ultima unidade vende-se da lista, com um clique.
    await page.goto('/admin/produtos');
    const vender = page.getByRole('button', { name: `Vendido na loja: ${nome}, medida 14` });
    await vender.click();
    await expect(page.getByRole('status').filter({ hasText: 'Registado.' })).toBeVisible();
    await expect(vender).toBeDisabled();
  });

  test('uma peça única não passa de uma unidade, e o servidor diz porquê', async ({ page }) => {
    const categoria = `Drusas ${sufixo}`;
    await criarCategoria(page, categoria, true);

    await page.goto('/admin/produtos/novo');
    await page.getByLabel('Categoria').selectOption({ label: `${categoria} (peças únicas)` });
    await page.getByLabel('Nome', { exact: true }).fill(`Drusa ${sufixo}`);
    await page.getByLabel('Preço, com IVA').fill('120');
    await page.getByLabel('Peso, em gramas').fill('900');
    await page.getByLabel('Em stock (0 ou 1)').fill('1');
    // Numa peca unica nao ha medidas para acrescentar.
    await expect(page.getByRole('button', { name: 'Acrescentar medida' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Criar produto' }).click();
    await expect(page).toHaveURL(/\/admin\/produtos\/[a-f0-9]{24}$/);

    await page.getByLabel('O que aconteceu').selectOption({ label: 'Entrada (chegou mercadoria)' });
    await page.getByLabel('Quantas unidades').fill('1');
    await page.getByRole('button', { name: 'Registar movimento' }).click();
    // No `main`: o Next injeta um anunciador de navegacao que tambem e `alert`.
    await expect(page.getByRole('main').getByRole('alert')).toContainText(
      'Uma peça única não passa de uma unidade.'
    );
  });

  test('uma categoria com anéis não passa a peças únicas', async ({ page }) => {
    const categoria = `Colares ${sufixo}`;
    await criarCategoria(page, categoria, false);

    await page.goto('/admin/produtos/novo');
    await page.getByLabel('Categoria').selectOption({ label: `${categoria} (com medidas)` });
    await page.getByLabel('Nome', { exact: true }).fill(`Colar ${sufixo}`);
    await page.getByLabel('Preço, com IVA').fill('20');
    await page.getByLabel('Peso, em gramas').fill('30');
    await page.getByLabel('Medida 1', { exact: true }).fill('45 cm');
    await page.getByLabel('Stock da medida 1').fill('1');
    await page.getByRole('button', { name: 'Criar produto' }).click();
    await expect(page).toHaveURL(/\/admin\/produtos\/[a-f0-9]{24}$/);

    await page.goto('/admin/categorias');
    const cartao = page.locator('form', { has: page.getByLabel(`Nome de ${categoria}`) });
    await cartao.getByLabel('Peças únicas').check();
    await cartao.getByRole('button', { name: 'Guardar' }).click();
    await expect(cartao.getByRole('alert')).toContainText(`Colar ${sufixo}`);
  });
});

test.describe('ao balcão, no telemóvel', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.beforeEach(async ({ context }) => iniciarSessao(context, 'ADMIN', { base: BASE, userId: ADMIN_ID }));

  test('o "vendido na loja" está à vista, sem deslizar para o lado', async ({ page }) => {
    // Numa tabela, ficava na ultima coluna, fora do ecra. Os testes de cima
    // ja deixaram produtos na base de dados.
    await page.goto('/admin/produtos');
    const botoes = page.getByRole('button', { name: /^Vendido na loja:/ });
    expect(await botoes.count()).toBeGreaterThan(0);
    for (const caixa of await botoes.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().right))) {
      expect(caixa).toBeLessThanOrEqual(390);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

test.describe('com a conta de cliente', () => {
  test('um cliente a sério não entra no painel', async ({ context, page }) => {
    await iniciarSessao(context, 'USER', { base: BASE, userId: CLIENTE_ID });
    expect((await page.goto('/admin'))?.status()).toBe(404);
  });

  test('uma sessão que diz ser de administrador, numa conta de cliente, não passa', async ({
    context,
    page,
  }) => {
    // Com base de dados, o papel vem dela e nao do token: um token que diga
    // ADMIN numa conta USER e corrigido antes de a pagina decidir.
    await iniciarSessao(context, 'ADMIN', { base: BASE, userId: CLIENTE_ID });
    expect((await page.goto('/admin'))?.status()).toBe(404);
    const r = await page.request.post('/api/admin/categorias', {
      data: { name: 'Intrusa', slug: `intrusa-${sufixo}`, pecasUnicas: false },
      failOnStatusCode: false,
    });
    expect(r.status()).toBe(403);
  });
});
