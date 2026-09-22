/**
 * Gera a imagem de partilha (Open Graph) a partir da marca em vetor.
 *
 * E um script e nao um `opengraph-image.tsx` de proposito: a imagem nao muda
 * entre pedidos, por isso nao ha razao para a desenhar em cada partilha. Corre
 * com `npm run marca:og` sempre que a marca mudar.
 *
 * Sem assinatura por baixo da marca de proposito: qualquer frase ali e uma
 * afirmacao comercial sobre o negocio, e isso decide-se na F9 do roteiro.
 */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (p) => readFileSync(join(raiz, p), 'utf8');

const simbolo = ler('public/marca/simbolo.svg');
const wordmark = ler('public/marca/wordmark.svg');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box }
  body {
    width: 1200px; height: 630px; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: #2a191d; font-family: Georgia, serif;
  }
  .marca { display: flex; align-items: center; gap: 30px }
  .marca svg:first-child { height: 230px }
  .marca svg:last-child { height: 92px; color: #fdf9db }
</style></head><body>
  <div class="marca">${simbolo}${wordmark}</div>
</body></html>`;

const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
});
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
await pagina.setContent(html);
const png = await pagina.screenshot({ type: 'png' });
writeFileSync(join(raiz, 'src/app/opengraph-image.png'), png);
await navegador.close();
console.log('src/app/opengraph-image.png', png.length, 'bytes');
