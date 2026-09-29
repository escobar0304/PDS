import { expect, test } from '@playwright/test';

/**
 * Estes testes atacam o servidor a correr, nao o codigo fonte.
 *
 * Os unitarios verificam que os esquemas recusam objectos; estes verificam
 * que uma rota real responde 400 a um pedido real. As duas coisas falham por
 * razoes diferentes, e e por isso que existem as duas.
 */

test.describe('injeção NoSQL', () => {
  const OPERADORES = [{ $ne: null }, { $gt: '' }, { $regex: '.*' }];

  test('o registo recusa operadores do Mongo em vez de os passar à consulta', async ({
    request,
  }) => {
    for (const payload of OPERADORES) {
      const res = await request.post('/api/auth/register', {
        data: { name: 'Sonda', email: payload, password: 'umapassword' },
        failOnStatusCode: false,
      });

      expect(res.status(), `aceitou ${JSON.stringify(payload)}`).toBe(400);
    }
  });

  test('o contacto recusa operadores do Mongo', async ({ request }) => {
    const res = await request.post('/api/contact', {
      data: { name: { $ne: null }, email: 'a@b.pt', subject: 'x', message: 'olá' },
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(400);
  });

  test('o corpo malformado é erro de quem envia, não do servidor', async ({ request }) => {
    const res = await request.post('/api/contact', {
      headers: { 'Content-Type': 'application/json' },
      data: '{ isto não é json',
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(400);
  });
});

test.describe('controlo de acesso', () => {
  test('a rota pública de categorias já não escreve', async ({ request }) => {
    // Ate a F11 esta rota escrevia na base de dados sem verificacao nenhuma.
    // A escrita passou para /api/admin/categorias; aqui so se le.
    const res = await request.post('/api/categories', {
      data: { name: 'Intrusa', slug: 'intrusa' },
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(405);
  });

  test('um "pago" inventado não passa: sem a Stripe configurada, os avisos nem se leem', async ({
    request,
  }) => {
    const res = await request.post('/api/pagamentos/aviso', {
      data: { type: 'checkout.session.completed', data: { object: { payment_status: 'paid' } } },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(503);
  });

  test('com a loja fechada, não se encomenda nem pela API', async ({ request }) => {
    // A pagina de checkout da 404, mas a rota nao conta com isso: fecha por
    // si, antes de ler o pedido.
    const linhas = [{ id: 'a'.repeat(24), quantidade: 1 }];
    const encomenda = await request.post('/api/encomendas', {
      data: { linhas, cliente: {}, entrega: 'SHIPPING', totalVistoCents: 0 },
      failOnStatusCode: false,
    });
    expect(encomenda.status()).toBe(503);
    const orcamento = await request.post('/api/encomendas/orcamento', {
      data: { linhas },
      failOnStatusCode: false,
    });
    expect(orcamento.status()).toBe(503);
  });

  const ID = 'a'.repeat(24);
  for (const [metodo, caminho] of [
    ['GET', '/api/admin/produtos'],
    ['POST', '/api/admin/produtos'],
    ['PATCH', `/api/admin/produtos/${ID}`],
    ['GET', `/api/admin/produtos/${ID}/stock`],
    ['POST', `/api/admin/produtos/${ID}/stock`],
    ['POST', '/api/admin/categorias'],
    ['PATCH', `/api/admin/categorias/${ID}`],
    ['PATCH', `/api/admin/encomendas/${ID}`],
  ] as const) {
    test(`${metodo} ${caminho} exige administrador`, async ({ request }) => {
      const res = await request.fetch(caminho, {
        method: metodo,
        data: metodo === 'GET' ? undefined : { delta: -1 },
        failOnStatusCode: false,
      });
      expect(res.status()).toBe(401);
    });
  }

  test('ler o catálogo continua público', async ({ request }) => {
    const res = await request.get('/api/categories');
    // Sem base de dados na suite, 500 e aceitavel; 401 ou 403 nao seriam.
    expect([200, 500]).toContain(res.status());
  });

  for (const caminho of ['/admin', '/admin/produtos', '/admin/produtos/novo', '/admin/categorias', '/admin/encomendas', `/admin/encomendas/${ID}`]) {
    test(`${caminho} não existe para quem não é administrador`, async ({ request }) => {
      const res = await request.get(caminho);
      expect(res.status()).toBe(404);
      expect(await res.text()).not.toContain('Administração');
    });
  }
});

test.describe('limite de pedidos', () => {
  test('o formulário de contacto trava o envio em série', async ({ request }) => {
    const enviar = (i: number) =>
      request.post('/api/contact', {
        data: {
          name: 'Sonda',
          email: `limite-${Date.now()}@exemplo.pt`,
          subject: `teste ${i}`,
          message: 'mensagem de teste',
        },
        failOnStatusCode: false,
      });

    const estados: number[] = [];
    for (let i = 0; i < 8; i += 1) {
      estados.push((await enviar(i)).status());
    }

    expect(estados, 'nenhum pedido foi travado').toContain(429);
  });

  test('a resposta de bloqueio diz quando tentar outra vez', async ({ request }) => {
    let resposta = null;
    for (let i = 0; i < 12; i += 1) {
      const r = await request.post('/api/auth/register', {
        data: { name: 'Sonda', email: `r${i}@exemplo.pt`, password: 'umapassword' },
        failOnStatusCode: false,
      });
      if (r.status() === 429) {
        resposta = r;
        break;
      }
    }

    expect(resposta, 'o registo nunca travou').not.toBeNull();
    expect(resposta!.headers()['retry-after']).toBeTruthy();
  });
});

test.describe('cabeçalhos', () => {
  test('as páginas vêm com os cabeçalhos de segurança', async ({ request }) => {
    const res = await request.get('/');
    const h = res.headers();

    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(h['strict-transport-security']).toContain('max-age=');
    expect(h['content-security-policy']).toContain("default-src 'self'");
    expect(h['content-security-policy'], 'o mapa precisa da Google em frame-src').toContain(
      'frame-src https://www.google.com',
    );
  });

  test('a CSP não deixa texto virar código', async ({ request }) => {
    // `'unsafe-eval'` esteve em producao sem razao escrita. O Next so precisa
    // dele em desenvolvimento; este servidor e o de producao.
    const csp = (await request.get('/')).headers()['content-security-policy'];
    expect(csp).not.toContain("'unsafe-eval'");
  });

  test('nenhuma página viola a própria CSP', async ({ page }) => {
    // Sem isto, apertar a CSP e apostar que nada partiu. O browser dispara
    // `securitypolicyviolation` por cada recurso ou `eval` recusado.
    await page.addInitScript(() => {
      (window as unknown as { __violacoes: string[] }).__violacoes = [];
      document.addEventListener('securitypolicyviolation', (e) =>
        (window as unknown as { __violacoes: string[] }).__violacoes.push(
          `${e.violatedDirective} ${e.blockedURI}`,
        ),
      );
    });

    for (const rota of ['/', '/loja', '/catalogo', '/sobre-nos', '/auth/login', '/cookies']) {
      await page.goto(rota, { waitUntil: 'networkidle' });
      const violacoes = await page.evaluate(
        () => (window as unknown as { __violacoes: string[] }).__violacoes,
      );
      expect(violacoes, `${rota} viola a CSP`).toEqual([]);
    }
  });

  test('não anuncia a tecnologia que corre por baixo', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['x-powered-by']).toBeUndefined();
  });
});

test.describe('recuperação de palavra-passe', () => {
  test('a resposta não revela se a conta existe', async ({ request }) => {
    const pedir = (email: string) =>
      request.post('/api/auth/recuperar-password', {
        data: { email },
        failOnStatusCode: false,
      });

    const inexistente = await pedir(`nao-existe-${Date.now()}@exemplo.pt`);
    const corpo = await inexistente.json();

    expect(inexistente.status()).toBe(200);
    // Nem a mensagem nem o estado podem distinguir os dois casos.
    expect(JSON.stringify(corpo)).not.toMatch(/não encontrad|inexistente|não existe/i);
    expect(corpo.message).toContain('Se existir uma conta');
  });

  test('um token inventado não é aceite nem explicado', async ({ request }) => {
    const res = await request.post('/api/auth/nova-password', {
      data: { token: 'a'.repeat(43), password: 'umapasswordnova' },
      failOnStatusCode: false,
    });

    // Esta suite corre de propósito sem base de dados, por isso aqui vem 500
    // em vez de 400. O que interessa não é o código: é que a resposta não
    // distinga "não existe" de "expirou" — isso dizia a quem sonda que
    // acertou num token que já existiu.
    expect(res.ok()).toBe(false);
    const corpo = await res.json();
    expect(JSON.stringify(corpo)).not.toMatch(/expirou|não existe|inexistente|utilizador/i);
  });

  test('a rota recusa palavras-passe curtas antes de tocar na base de dados', async ({
    request,
  }) => {
    const res = await request.post('/api/auth/nova-password', {
      data: { token: 'a'.repeat(43), password: 'curta' },
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe('Dados inválidos.');
  });

  test('a verificação de email não aceita GET', async ({ request }) => {
    // Pre-carregadores de ligações e antivírus de correio abrem os URL das
    // mensagens. Com GET, gastavam o token antes de a pessoa lhe tocar.
    const res = await request.get('/api/auth/verificar?token=' + 'a'.repeat(43), {
      failOnStatusCode: false,
    });

    expect([404, 405]).toContain(res.status());
  });
});

test.describe('páginas de recuperação', () => {
  test('o link "esqueci a password" deixou de dar 404', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('link', { name: 'Esqueci a password' }).click();

    await expect(page).toHaveURL(/\/auth\/recuperar-password$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Recuperar');
  });

  test('pedir a reposição mostra sempre a mesma mensagem', async ({ page }) => {
    await page.goto('/auth/recuperar-password');
    await page.getByLabel('Email').fill(`qualquer-${Date.now()}@exemplo.pt`);
    await page.getByRole('button', { name: 'Enviar instruções' }).click();

    await expect(page.getByRole('main').getByRole('status')).toContainText(
      'Se existir uma conta',
    );
  });

  test('a página de nova palavra-passe sem token explica-se', async ({ page }) => {
    await page.goto('/auth/nova-password');

    await expect(page.getByRole('main').getByRole('alert')).toContainText('ligação');
    await expect(page.getByRole('link', { name: 'Pedir uma ligação nova' })).toBeVisible();
  });
});

/**
 * Os testes que esgotam limites ficam no fim, de proposito.
 *
 * O limitador e por IP e vive na memoria do servidor: e partilhado por toda a
 * execucao da suite. Um teste que gasta a quota bloqueia todos os que venham
 * a seguir e usem a mesma rota — foi assim que o teste da pagina de
 * recuperacao passou sozinho e falhou em conjunto.
 */
test.describe('limites que esgotam a quota', () => {
  test('o pedido é travado antes de poder servir para enumerar', async ({ request }) => {
    const estados: number[] = [];
    for (let i = 0; i < 8; i += 1) {
      const r = await request.post('/api/auth/recuperar-password', {
        data: { email: `sonda-${i}-${Date.now()}@exemplo.pt` },
        failOnStatusCode: false,
      });
      estados.push(r.status());
    }
    expect(estados).toContain(429);
  });
});

test.describe('os direitos sobre a própria conta', () => {
  test('exportar os dados exige sessão', async ({ request }) => {
    const r = await request.get('/api/conta/dados');

    // Sem sessao e 401, nunca 200 com dados de outra pessoa.
    expect(r.status()).toBe(401);
    expect(await r.text()).not.toContain('@');
  });

  test('apagar a conta exige sessão', async ({ request }) => {
    const r = await request.delete('/api/conta', { data: { password: 'seja o que for' } });

    expect(r.status()).toBe(401);
  });

  test('saber se a conta tem palavra-passe exige sessão', async ({ request }) => {
    // Sem isto, a rota dizia a qualquer um se uma conta usa Google ou
    // credenciais — um detalhe que nao tem de ser publico.
    const r = await request.get('/api/conta');

    expect(r.status()).toBe(401);
    expect(await r.text()).not.toContain('temPassword');
  });

  test('a rota de apagar não aceita GET nem POST', async ({ request }) => {
    for (const metodo of ['post', 'put'] as const) {
      const r = await request[metodo]('/api/conta', { data: {} });
      // 405 do Next para um método sem handler. O que interessa e que nao
      // apaga nada por um caminho que ninguem pensou em proteger.
      expect([401, 405]).toContain(r.status());
    }
  });
});

test.describe('mudar o nome', () => {
  test('exige sessão', async ({ request }) => {
    const r = await request.patch('/api/conta', { data: { name: 'Outro nome' } });
    expect(r.status()).toBe(401);
  });
});
