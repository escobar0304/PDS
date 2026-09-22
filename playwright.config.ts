import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

// Alguns ambientes de desenvolvimento ja trazem um Chromium instalado numa
// versao diferente da que este Playwright descarregaria. No CI usa-se sempre o
// browser que o proprio Playwright instala.
const CHROMIUM_LOCAL = '/opt/pw-browsers/chromium';
const usarChromiumLocal = !process.env.CI && existsSync(CHROMIUM_LOCAL);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: usarChromiumLocal
          ? { executablePath: CHROMIUM_LOCAL }
          : {},
      },
    },
  ],
  webServer: {
    command: `npm run build && npx next start --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      // MONGODB_URI fica de fora de proposito: os testes verificam que o site
      // aguenta a base de dados em baixo. O segredo do NextAuth e configuracao
      // obrigatoria em producao, nao um cenario de falha, por isso vai aqui.
      NEXTAUTH_SECRET: 'segredo-apenas-para-testes-e2e',
      NEXTAUTH_URL: `http://127.0.0.1:${PORT}`,
    },
  },
});
