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

test('os motores de busca estão bloqueados até haver camada legal', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.ok()).toBeTruthy();
  const corpo = await res.text();
  expect(corpo).toContain('Disallow: /');
  expect(corpo).not.toContain('Allow: /');
});

test('todos os campos de formulário têm etiqueta associada', async ({ page }) => {
  for (const rota of ['/auth/login', '/auth/register', '/sobre-nos', '/loja']) {
    await page.goto(rota);

    const semEtiqueta = await page
      .getByRole('main')
      .locator('input:not([type=hidden]), select, textarea')
      .evaluateAll((campos) =>
        campos
          .filter((c) => {
            const id = c.getAttribute('id');
            // Tres formas validas de dar nome a um campo: um <label for>, o
            // campo dentro do proprio <label>, ou um aria-label.
            const porFor = id && document.querySelector(`label[for="${CSS.escape(id)}"]`);
            const porDentro = c.closest('label');
            return !porFor && !porDentro && !c.getAttribute('aria-label');
          })
          .map((c) => c.outerHTML.slice(0, 80)),
      );

    expect(semEtiqueta, `campos sem etiqueta em ${rota}`).toEqual([]);
  }
});

test('a marca é servida como vetor, não como imagem pesada', async ({ page, request }) => {
  const pesados: string[] = [];
  page.on('response', (res) => {
    const url = res.url();
    if (/\/(marca|images)\//.test(url) && /logo/.test(url)) pesados.push(url);
  });

  await page.goto('/');

  // O logotipo antigo eram tres PNG em base64 dentro de um SVG de 636 kB,
  // carregado no cabecalho de todas as paginas.
  expect(pesados, 'nenhuma pagina deve voltar a pedir o logotipo antigo').toEqual([]);

  for (const ficheiro of ['/marca/simbolo.svg', '/marca/wordmark.svg']) {
    const res = await request.get(ficheiro);
    expect(res.ok(), `${ficheiro} deve existir`).toBeTruthy();
    const corpo = await res.text();
    expect(corpo, `${ficheiro} nao pode ter rasters embutidos`).not.toContain('base64');
  }
});

test('o cabeçalho e o rodapé mostram a marca uma vez cada', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('banner').getByRole('img', { name: 'Pétalas de Sonho' }),
  ).toHaveCount(1);
  await expect(
    page.getByRole('contentinfo').getByRole('img', { name: 'Pétalas de Sonho' }),
  ).toHaveCount(1);
});

test('as páginas cabem no orçamento de imagens', async ({ page }) => {
  // Medido em 22/09/2026, com a cache desligada: a home custava 582 kB de
  // imagens e passou a 287 kB. O limite e generoso de propósito — serve para
  // apanhar uma regressao grande, como perder o `sizes` ou voltar a q=90,
  // e nao para discutir kilobytes.
  const LIMITE_KB = 420;

  let bytes = 0;
  page.on('response', async (res) => {
    if (!(res.headers()['content-type'] ?? '').startsWith('image/')) return;
    try {
      bytes += (await res.body()).length;
    } catch {
      // Resposta sem corpo acessivel: nao conta.
    }
  });

  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);

  expect(Math.round(bytes / 1024), 'orçamento de imagens da página inicial').toBeLessThan(
    LIMITE_KB,
  );
});

test('nenhuma imagem fica por carregar', async ({ page }) => {
  for (const rota of ['/', '/sobre-nos']) {
    await page.goto(rota);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const partidas = await page
      .locator('img')
      .evaluateAll((imgs) =>
        imgs
          .filter((i) => !(i as HTMLImageElement).naturalWidth)
          .map((i) => (i as HTMLImageElement).currentSrc || i.getAttribute('src') || '?'),
      );

    expect(partidas, `imagens partidas em ${rota}`).toEqual([]);
  }
});
