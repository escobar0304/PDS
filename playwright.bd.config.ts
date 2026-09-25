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
 * Corre no CI, contra o MongoDB e o `stripe-mock` do job `e2e-bd`; aqui,
 * pelos contentores Docker do CLAUDE.md. Uma alteracao que lhe toque so se
 * sabe verdadeira depois do CI passar.
 *
 * A loja abre **em ensaio** (`LOJA_ENSAIO`, `lib/loja.ts`): com os portes e
 * o prazo do negocio por preencher, sem ele o checkout nao existia para
 * testar. Com uma chave de testes, e contra o simulador da Stripe.
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
      LOJA_ENSAIO: '1',
      STRIPE_SECRET_KEY: 'sk_test_123',
      STRIPE_WEBHOOK_SECRET: 'whsec_apenas_para_testes',
      STRIPE_API_HOST: process.env.STRIPE_API_HOST ?? '127.0.0.1',
      NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${PORT}`,
      NEXTAUTH_SECRET: 'segredo-apenas-para-testes-e2e',
      NEXTAUTH_URL: `http://127.0.0.1:${PORT}`,
    },
  },
});
