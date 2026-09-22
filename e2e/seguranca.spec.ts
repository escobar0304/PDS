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
  test('criar categorias exige sessão', async ({ request }) => {
    // Ate a F11 esta rota escrevia na base de dados sem verificacao nenhuma.
    const res = await request.post('/api/categories', {
      data: { name: 'Intrusa', slug: 'intrusa' },
      failOnStatusCode: false,
    });

    expect(res.status(), 'rota de escrita aberta a qualquer pessoa').toBe(401);
  });

  test('ler o catálogo continua público', async ({ request }) => {
    const res = await request.get('/api/categories');
    // Sem base de dados na suite, 500 e aceitavel; 401 ou 403 nao seriam.
    expect([200, 500]).toContain(res.status());
  });
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

  test('não anuncia a tecnologia que corre por baixo', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['x-powered-by']).toBeUndefined();
  });
});
