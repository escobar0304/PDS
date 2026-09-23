import { expect, test } from '@playwright/test';

/**
 * O percurso completo de autenticacao precisa de base de dados e fica para um
 * trabalho de integracao proprio. Aqui testa-se o que e do cliente: formularios,
 * validacao, mensagens e navegacao entre as duas paginas.
 */

test('a página de entrada mostra o formulário com etiquetas visíveis', async ({ page }) => {
  await page.goto('/auth/login');

  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});

/**
 * Este teste afirmava o contrario: que o botao da Google estava **sempre**
 * visivel. Era o defeito escrito como expectativa.
 *
 * GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET sao opcionais (`src/lib/env.ts`), e
 * este servidor de testes corre sem elas de proposito. Antes, o provedor era
 * registado na mesma com `clientId: undefined` e o botao aparecia: quem
 * carregasse aterrava num fluxo OAuth partido.
 *
 * O caso configurado nao se testa aqui — exigiria credenciais reais da Google
 * e um pedido a sair para fora. A logica do componente esta coberta em
 * `src/lib/__tests__/provedores.test.ts`.
 */
test('sem a Google configurada, não se oferece entrar com a Google', async ({ page }) => {
  await page.goto('/auth/login');

  // Espera-se pelo formulario para garantir que a pagina hidratou: sem isso,
  // "o botao nao esta la" passaria antes de o `getProviders()` sequer correr,
  // e o teste ficava verde por chegar cedo demais.
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();

  await expect(page.getByRole('button', { name: /Continuar com Google/ })).toHaveCount(0);
  // Sem a Google, o separador "Ou com email" tambem nao tem sentido.
  await expect(page.getByText('Ou com email')).toHaveCount(0);

  // E o essencial continua la: uma instalacao sem Google nao pode ficar sem
  // forma nenhuma de entrar.
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
});

test('os campos obrigatórios impedem a submissão', async ({ page }) => {
  await page.goto('/auth/login');

  await page.getByRole('button', { name: 'Entrar' }).click();

  // O browser bloqueia a submissao, por isso continuamos na mesma pagina
  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByLabel('Email')).toBeFocused();
});

test('o registo recusa passwords diferentes sem ir ao servidor', async ({ page }) => {
  let chamouServidor = false;
  await page.route('**/api/auth/register', (route) => {
    chamouServidor = true;
    return route.fulfill({ status: 500, body: '{}' });
  });

  await page.goto('/auth/register');
  await page.getByLabel('Nome').fill('Marta Ferreira');
  await page.getByLabel('Email').fill('marta@exemplo.pt');
  await page.getByLabel('Password', { exact: true }).fill('umapassword');
  await page.getByLabel('Confirmar password').fill('outrapassword');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page.getByText('As passwords não coincidem')).toBeVisible();
  expect(chamouServidor, 'não devia ter chamado o servidor').toBe(false);
});

test('um erro do servidor no registo é mostrado ao utilizador', async ({ page }) => {
  await page.route('**/api/auth/register', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Este email já está registado' }),
    })
  );

  await page.goto('/auth/register');
  await page.getByLabel('Nome').fill('Marta Ferreira');
  await page.getByLabel('Email').fill('marta@exemplo.pt');
  await page.getByLabel('Password', { exact: true }).fill('umapassword');
  await page.getByLabel('Confirmar password').fill('umapassword');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page.getByText('Este email já está registado')).toBeVisible();
});

test('as duas páginas ligam uma à outra', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByRole('link', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL(/\/auth\/register/);

  await page.getByRole('link', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
});

test('a área pessoal exige sessão iniciada', async ({ page }) => {
  await page.goto('/area-pessoal');
  await expect(page).toHaveURL(/\/auth\/login/);
});
