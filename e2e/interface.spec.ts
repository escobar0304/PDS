import { expect, test } from '@playwright/test';
import { mockApi } from './fixtures/api';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test.describe('telemóvel', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('o menu abre, navega e fecha', async ({ page }) => {
    await page.goto('/');

    const nav = page.getByRole('banner').getByRole('navigation');
    await expect(nav).toHaveCount(0);

    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Loja' })).toBeVisible();

    await page.getByRole('banner').getByRole('link', { name: 'Loja' }).click();
    await expect(page).toHaveURL(/\/loja$/);
  });

  test('o botão do menu anuncia o seu estado', async ({ page }) => {
    await page.goto('/');
    const botao = page.getByRole('button', { name: 'Menu' });

    await expect(botao).toHaveAttribute('aria-expanded', 'false');
    await botao.click();
    await expect(botao).toHaveAttribute('aria-expanded', 'true');
  });

  test('nenhuma página tem deslocamento horizontal', async ({ page }) => {
    for (const rota of ['/', '/loja', '/catalogo', '/sobre-nos', '/carrinho']) {
      await page.goto(rota);
      const transborda = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      expect(transborda, `${rota} desliza na horizontal`).toBe(false);
    }
  });
});

test('o foco de teclado é visível', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');

  const temContorno = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return false;
    const estilo = getComputedStyle(el);
    return estilo.outlineStyle !== 'none' && parseFloat(estilo.outlineWidth) > 0;
  });

  expect(temContorno, 'o elemento com foco não tem contorno visível').toBe(true);
});

test('as imagens têm texto alternativo com significado', async ({ page }) => {
  await page.goto('/sobre-nos');

  const maus = await page.locator('img').evaluateAll((imgs) =>
    imgs
      .map((img) => ({
        src: (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src,
        alt: img.getAttribute('alt'),
      }))
      .filter((i) => !i.alt || /^(imagem|image|foto|photo)$/i.test(i.alt))
      .map((i) => i.src)
  );

  expect(maus, 'imagens sem texto alternativo útil').toEqual([]);
});

test('cada página tem exatamente um h1', async ({ page }) => {
  for (const rota of ['/', '/loja', '/catalogo', '/sobre-nos', '/carrinho']) {
    await page.goto(rota);
    await expect(page.locator('h1'), `${rota}`).toHaveCount(1);
  }
});

test('as marcas estruturais da página existem', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);
});
