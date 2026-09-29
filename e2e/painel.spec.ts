import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { iniciarSessao } from './fixtures/sessao';

/**
 * O painel, com uma sessao assinada e sem base de dados.
 *
 * O que `seguranca.spec.ts` ja provava era "sem sessao, 404". O que faltava
 * era o caso que importa: **uma pessoa com conta, que nao e administradora**.
 * Um painel que so verificasse se ha sessao passava o primeiro e abria-se a
 * qualquer cliente.
 */

const PAGINAS = [
  '/admin',
  '/admin/produtos',
  '/admin/produtos/novo',
  '/admin/categorias',
  '/admin/encomendas',
  `/admin/encomendas/${'a'.repeat(24)}`,
];

test.describe('com sessão de cliente', () => {
  test.beforeEach(async ({ context }) => iniciarSessao(context, 'USER'));

  for (const caminho of PAGINAS) {
    test(`${caminho} não existe`, async ({ page }) => {
      const res = await page.goto(caminho);
      expect(res?.status()).toBe(404);
      await expect(page.getByRole('heading', { name: 'Painel' })).toHaveCount(0);
    });
  }

  test('a API do painel responde 403, e não faz nada', async ({ page }) => {
    const res = await page.request.post('/api/admin/categorias', {
      data: { name: 'Intrusa', slug: 'intrusa', pecasUnicas: false },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(403);
  });
});

test.describe('com sessão de administrador', () => {
  test.beforeEach(async ({ context }) => iniciarSessao(context, 'ADMIN'));

  for (const caminho of PAGINAS) {
    test(`${caminho} abre, diz que não há base de dados, e não tem violações WCAG`, async ({ page }) => {
      const res = await page.goto(caminho);
      expect(res?.status()).toBe(200);
      await expect(page.getByText('Não foi possível ler a base de dados')).toBeVisible();

      const r = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(r.violations.map((v) => `[${v.impact}] ${v.id}: ${v.nodes[0]?.html.slice(0, 80)}`)).toEqual([]);
    });
  }

  test('cada página tem um só título principal', async ({ page }) => {
    // O cabecalho antigo tinha um <h1> seu, e cada pagina outro.
    for (const caminho of PAGINAS) {
      await page.goto(caminho);
      await expect(page.locator('h1'), caminho).toHaveCount(1);
    }
  });
});
