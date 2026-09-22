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

// Falha hoje: /privacidade, /termos, /envios, /faq e /contacto ainda nao
// existem. Passa a verde quando a camada legal do roteiro (F4 a F8) aterrar.
// Nao apagar: e este teste que impede que a divida seja esquecida.
test.fixme('nenhuma ligação do rodapé cai num 404', async ({ page }) => {
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
