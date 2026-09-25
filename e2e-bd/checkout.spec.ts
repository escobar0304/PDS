import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Browser, type Page } from '@playwright/test';
import mongoose from 'mongoose';
import { iniciarSessao } from '../e2e/fixtures/sessao';
import { ADMIN_ID, BASE } from './contas';

/**
 * A compra, do carrinho a pagina da Stripe, com a loja aberta em ensaio
 * (`lib/loja.ts`: portes e prazo inventados, chave de testes, `stripe-mock`).
 *
 * O que so se prova assim: que o total que a pessoa ve antes do botao e o que
 * o servidor cobra, que a encomenda fica gravada com o stock reservado, e que
 * duas pessoas nao compram a mesma peca unica.
 *
 * A pagina da Stripe e simulada no browser: o `stripe-mock` devolve um
 * endereco de checkout.stripe.com, e este ambiente nao chega la.
 */

const sufixo = Date.now().toString(36);
let contador = 0;

test.beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
});
test.afterAll(async () => {
  await mongoose.disconnect();
});

/** Uma peca unica, criada pela API do painel. Devolve o endereco e o id. */
async function peca(browser: Browser, precoCents: number, pesoGramas = 300) {
  const n = `${sufixo}-${++contador}`;
  const admin = await browser.newContext();
  await iniciarSessao(admin, 'ADMIN', { base: BASE, userId: ADMIN_ID });
  const api = admin.request;

  const c = await api.post(`${BASE}/api/admin/categorias`, {
    data: { name: `Drusas ${n}`, slug: `drusas-${n}`, pecasUnicas: true },
  });
  expect(c.status()).toBe(201);
  const p = await api.post(`${BASE}/api/admin/produtos`, {
    data: {
      name: `Drusa ${n}`,
      slug: `drusa-${n}`,
      priceCents: precoCents,
      weightGrams: pesoGramas,
      categoryId: (await c.json()).id,
      images: [],
      featured: false,
      active: true,
      variantes: [{ stock: 1 }],
    },
  });
  expect(p.status()).toBe(201);
  const id: string = (await p.json()).id;

  return {
    nome: `Drusa ${n}`,
    slug: `drusa-${n}`,
    id,
    /** Mudar o preco, como o painel. */
    mudarPreco: async (priceCents: number) => {
      const r = await api.patch(`${BASE}/api/admin/produtos/${id}`, { data: { priceCents } });
      expect(r.status()).toBe(200);
    },
  };
}

async function paraOCarrinho(page: Page, slug: string) {
  await page.goto(`/produto/${slug}`);
  await page.getByRole('button', { name: 'Adicionar ao Carrinho', exact: true }).click();
  await page.goto('/carrinho');
}

async function preencher(page: Page, codigoPostal = '4000-123') {
  await page.getByLabel('Nome', { exact: true }).fill('Marta Silva');
  await page.getByLabel('Email', { exact: true }).fill('Marta@Exemplo.pt');
  await page.getByLabel('Telefone', { exact: true }).fill('912 345 678');
  await page.getByLabel('Morada', { exact: true }).fill('Rua das Flores, 12');
  await page.getByLabel('Código postal', { exact: true }).fill(codigoPostal);
  await page.getByLabel('Localidade', { exact: true }).fill('Porto');
}

/** A pagina da Stripe, simulada: so interessa que se chegou la. */
async function simularStripe(page: Page) {
  await page.route('https://checkout.stripe.com/**', (r) =>
    r.fulfill({ contentType: 'text/html', body: '<title>Stripe</title><h1>Pagamento</h1>' })
  );
}

const ENCOMENDAR = { name: 'Encomenda com obrigação de pagar' };

test('uma peça única, do carrinho à página de pagamento', async ({ browser, page }) => {
  const p = await peca(browser, 4500);
  await simularStripe(page);

  await paraOCarrinho(page, p.slug);
  await page.getByRole('link', { name: 'Finalizar encomenda' }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  // O ensaio diz que o e, e o total vem com os portes da tabela de ensaio.
  await expect(page.getByText('Ensaio.')).toBeVisible();
  await expect(page.locator('[data-total]')).toHaveText('49,50 €');
  await expect(page.getByText('4,50 €')).toBeVisible();

  // A informacao da lei, antes do botao.
  const antes = page.getByRole('region', { name: 'Antes de encomendar' });
  await expect(antes).toContainText('14 dias');
  await expect(antes).toContainText('cartão de débito ou de crédito ou MB WAY');

  // Vazio: cada campo diz o que falta, e o primeiro recebe o foco.
  await page.getByRole('button', ENCOMENDAR).click();
  await expect(page.getByText('Falta o nome.')).toBeVisible();
  await expect(page.getByLabel('Nome', { exact: true })).toBeFocused();

  // A Madeira fica fora da zona de envio.
  await preencher(page, '9000-018');
  await page.getByRole('button', ENCOMENDAR).click();
  await expect(page.getByText(/Um código postal do continente/)).toBeVisible();

  await page.getByLabel('Código postal', { exact: true }).fill('4000-123');
  await page.getByRole('button', ENCOMENDAR).click();
  await expect(page).toHaveURL(/^https:\/\/checkout\.stripe\.com\//);

  // Gravada como a pessoa a viu, a espera do pagamento, com a peca reservada.
  const e = await mongoose.connection.collection('orders').findOne({ 'items.productId': new mongoose.Types.ObjectId(p.id) });
  expect(e).toMatchObject({
    status: 'PENDING',
    customerEmail: 'marta@exemplo.pt',
    customerPhone: '912345678',
    shippingPostal: '4000-123',
    subtotalCents: 4500,
    shippingCents: 450,
    totalCents: 4950,
  });
  expect(e!.pagamentoId).toMatch(/^cs_/);
  expect(e!.chaveHash).toMatch(/^[a-f0-9]{64}$/);

  const outra = await browser.newPage();
  await outra.goto(`${BASE}/produto/${p.slug}`);
  await expect(outra.getByText('Esgotado')).toBeVisible();
  await outra.close();
});

test('a mesma peça em dois carrinhos: quem chega depois vê que esgotou', async ({ browser, page }) => {
  const p = await peca(browser, 3000);
  await simularStripe(page);

  const segunda = await browser.newPage({ baseURL: BASE });
  await paraOCarrinho(segunda, p.slug);

  await paraOCarrinho(page, p.slug);
  await page.goto('/checkout');
  await preencher(page);
  await page.getByRole('button', ENCOMENDAR).click();
  await expect(page).toHaveURL(/checkout\.stripe\.com/);

  await segunda.goto('/checkout');
  await expect(segunda.getByRole('main').getByRole('alert')).toContainText(`${p.nome} esgotou`);
  await expect(segunda.getByRole('button', ENCOMENDAR)).toBeDisabled();
  await segunda.close();
});

test('o preço muda entre ver o total e encomendar: só se encomenda depois de ver o novo', async ({
  browser,
  page,
}) => {
  const p = await peca(browser, 2000);
  await simularStripe(page);

  await paraOCarrinho(page, p.slug);
  await page.goto('/checkout');
  await expect(page.locator('[data-total]')).toHaveText('24,50 €');
  await preencher(page);

  await p.mudarPreco(2500);
  await page.getByRole('button', ENCOMENDAR).click();

  // Recusada, com o novo total a vista, e nada reservado.
  await expect(page.getByRole('main').getByRole('alert')).toContainText('O total mudou para 29,50 €');
  await expect(page.locator('[data-total]')).toHaveText('29,50 €');
  expect(
    await mongoose.connection.collection('orders').countDocuments({ 'items.productId': new mongoose.Types.ObjectId(p.id) })
  ).toBe(0);

  await page.getByRole('button', ENCOMENDAR).click();
  await expect(page).toHaveURL(/checkout\.stripe\.com/);
  const e = await mongoose.connection.collection('orders').findOne({ 'items.productId': new mongoose.Types.ObjectId(p.id) });
  expect(e?.totalCents).toBe(2950);
});

test('o checkout não tem violações WCAG 2.1 AA, nem com os erros à vista', async ({ browser, page }) => {
  // So aqui se chega ao checkout: na suite sem base de dados, a loja esta
  // fechada e ele nao existe.
  const p = await peca(browser, 1500);
  await paraOCarrinho(page, p.slug);
  await page.goto('/checkout');
  await expect(page.locator('[data-total]')).toBeVisible();

  const violacoes = async () =>
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations.map(
      (v) => `[${v.impact}] ${v.id}: ${v.nodes[0]?.html.slice(0, 80)}`
    );

  expect(await violacoes()).toEqual([]);
  await page.getByRole('button', ENCOMENDAR).click();
  await expect(page.getByText('Falta o nome.')).toBeVisible();
  expect(await violacoes()).toEqual([]);
});

test('voltar da Stripe com uma ligação que não é de nenhuma encomenda: nada acontece, e a chave sai do endereço', async ({
  page,
}) => {
  await page.goto(`/carrinho?desistir=${'a'.repeat(24)}&chave=${'B'.repeat(43)}`);
  await expect(page).toHaveURL(/\/carrinho$/);
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
});
