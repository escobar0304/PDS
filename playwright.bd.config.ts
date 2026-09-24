import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

/**
 * Os testes de ponta a ponta **com** base de dados.
 *
 * A suite principal (`playwright.config.ts`) corre sem ela de proposito:
 * prova que o sitio aguenta a base de dados em baixo. Mas nao prova nada
 * sobre o painel de gestao, cujos formularios so aparecem com categorias e
 * produtos lidos da base de dados. E isso que esta prova.
 *
 * Nao corre aqui: o binario do MongoDB nao e descarregavel deste ambiente.
 * Corre no CI, contra o MongoDB do job `e2e-bd`. Uma alteracao que lhe toque
 * so se sabe verdadeira depois do CI passar.
 */

const PORT = 3200;
const CHROMIUM_LOCAL = '/opt/pw-browsers/chromium';
const usarChromiumLocal = !process.env.CI && existsSync(CHROMIUM_LOCAL);

if (!process.env.MONGODB_URI) {
  throw new Error('playwright.bd.config.ts precisa de MONGODB_URI: corre no CI, no job e2e-bd.');
}

export default defineConfig({
  testDir: './e2e-bd',
  globalSetup: './e2e-bd/preparar.ts',
  // Em serie: os testes escrevem na mesma base de dados.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: usarChromiumLocal ? { executablePath: CHROMIUM_LOCAL } : {},
      },
    },
  ],
  webServer: {
    command: `npm run build && npx next start --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      MONGODB_URI: process.env.MONGODB_URI,
      NEXTAUTH_SECRET: 'segredo-apenas-para-testes-e2e',
      NEXTAUTH_URL: `http://127.0.0.1:${PORT}`,
    },
  },
});
