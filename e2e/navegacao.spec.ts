import { expect, test } from '@playwright/test';
import { mockApi } from './fixtures/api';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('os links do cabeçalho levam às páginas certas', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('banner').getByRole('navigation').first();

  for (const [nome, destino] of [
    ['Sobre Nós', '/sobre-nos'],
    ['Catálogo', '/catalogo'],
    ['Loja', '/loja'],
  ] as const) {
    await nav.getByRole('link', { name: nome }).click();
    await expect(page).toHaveURL(new RegExp(`${destino}$`));
    await page.goto('/');
  }
});

test('o logótipo volta ao início', async ({ page }) => {
  await page.goto('/sobre-nos');
  await page.getByRole('banner').getByRole('link').first().click();
  await expect(page).toHaveURL(/\/$/);
});

// Estava adiado desde a F0b, a espera de /privacidade, /termos, /envios,
// /faq e /contacto. Passa a correr na F10: o rodape le de `src/lib/paginas.ts`
// e so mostra o que existe, por isso nao ha como ligar para o que falta.
test('nenhuma ligação do rodapé cai num 404', async ({ page }) => {
  await page.goto('/');
  const rodape = page.getByRole('contentinfo');

  const internos = await rodape.locator('a[href^="/"]').evaluateAll((as) =>
    as.map((a) => (a as HTMLAnchorElement).getAttribute('href')!)
  );
  expect(internos.length).toBeGreaterThan(0);

  const mortos: string[] = [];
  for (const href of [...new Set(internos)]) {
    const resposta = await page.request.get(href);
    if (resposta.status() === 404) mortos.push(href);
  }

  expect(mortos, 'ligações do rodapé que dão 404').toEqual([]);
});

test('o Livro de Reclamações aponta para o portal oficial', async ({ page }) => {
  await page.goto('/');
  const link = page
    .getByRole('contentinfo')
    .getByRole('link', { name: 'Livro de Reclamações' });

  await expect(link).toHaveAttribute('href', /livroreclamacoes\.pt/);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
});

test('o caminho da loja até ao produto funciona', async ({ page }) => {
  await page.goto('/loja');
  await page.getByRole('link', { name: 'Quartzo Rosa Bruto' }).first().click();
  await expect(page).toHaveURL(/\/produto\/quartzo-rosa-bruto$/);
  await expect(page.getByRole('heading', { name: 'Quartzo Rosa Bruto' })).toBeVisible();
});

test('as migalhas do produto voltam atrás', async ({ page }) => {
  await page.goto('/produto/quartzo-rosa-bruto');
  await page.getByRole('link', { name: 'Loja', exact: true }).first().click();
  await expect(page).toHaveURL(/\/loja/);
});

test('a página de contactos identifica o prestador', async ({ page }) => {
  await page.goto('/contacto');

  // Art. 10.o do DL 7/2004: a identificacao tem de estar acessivel de forma
  // permanente e direta. Enquanto os dados faltarem, a pagina diz que faltam
  // em vez de os inventar.
  await expect(page.getByRole('heading', { name: 'Identificação' })).toBeVisible();
  await expect(page.getByText('Denominação')).toBeVisible();
  await expect(page.getByText('NIF')).toBeVisible();

  const porPreencher = await page.getByText('por preencher').count();
  if (porPreencher > 0) {
    await expect(page.getByRole('main').getByRole('alert')).toContainText('não estão completos');
  }
});

test('o formulário de contacto vive numa página própria', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Contactos' }).click();

  await expect(page).toHaveURL(/\/contacto$/);
  await expect(page.getByLabel('Mensagem *')).toBeVisible();
});

test('as perguntas frequentes não inventam perguntas', async ({ page }) => {
  await page.goto('/faq');

  // Um FAQ inventado compromete o negocio com condicoes que ninguem decidiu.
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Perguntas');
  await expect(page.getByRole('link', { name: 'Fazer uma pergunta' })).toBeVisible();
});

test('o rodapé não promete páginas que não existem', async ({ page }) => {
  await page.goto('/');

  const rotulos = await page
    .getByRole('contentinfo')
    .locator('a[href^="/"]')
    .evaluateAll((as) => as.map((a) => a.textContent?.trim()));

  // Estas duas dependem de decisões do negócio e ainda não existem. Enquanto
  // não existirem, não podem aparecer no rodapé.
  expect(rotulos).not.toContain('Termos e Condições');
  expect(rotulos).not.toContain('Envios e Devoluções');
});

test('a entidade de resolução de litígios está acessível a partir de qualquer página', async ({ page }) => {
  // Lei 144/2015, art. 18: nome e sitio da entidade competente, de forma
  // facilmente acessivel. O rodape leva a explicacao, e a explicacao leva a
  // entidade. "Competente", nunca "aderimos": a adesao nao foi confirmada.
  await page.goto('/');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Resolução de litígios' }).click();
  await expect(page).toHaveURL(/\/contacto#litigios$/);

  const seccao = page.locator('#litigios');
  await expect(seccao.getByRole('heading', { name: 'Resolução de litígios' })).toBeVisible();
  await expect(seccao.getByRole('link', { name: /CICAP/ })).toHaveAttribute(
    'href',
    'https://cicap.pt',
  );
  await expect(seccao).toContainText('competente');
  await expect(seccao).not.toContainText(/aderi/i);
  // A plataforma europeia de litigios em linha foi descontinuada em 07/2025.
  await expect(page.locator('a[href*="ec.europa.eu/consumers/odr"]')).toHaveCount(0);
});
