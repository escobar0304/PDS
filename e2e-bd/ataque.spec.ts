import { expect, test, type APIRequestContext, type Browser } from '@playwright/test';
import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { encode } from 'next-auth/jwt';
import { iniciarSessao } from '../e2e/fixtures/sessao';
import { ADMIN_ID, BASE, CLIENTE_ID, SEM_IDADE_ID } from './contas';
import sharp from 'sharp';

/**
 * O sitio atacado a correr, com base de dados, como o faria alguem de fora.
 *
 * Os testes unitarios provam que cada guarda recusa o que deve; estes provam
 * que a guarda esta la quando se fala com o servidor a serio — pela rede,
 * com cookies, com o Mongo por tras. Cada ataque e um que resultou noutro
 * sitio ou que este ja teve (`docs/SEGURANCA.md`).
 *
 * O limite de pedidos e por IP (`identificar`), e todos estes pedidos vem do
 * mesmo. Cada ataque que nao e sobre o limite leva o seu `X-Forwarded-For`,
 * para nao gastar a quota dos outros. Que isso funcione e, em si, a
 * limitacao conhecida do limite: so trava de verdade na borda.
 */

const sufixo = Date.now().toString(36);
let ip = 0;
const outroIp = () => ({ 'X-Forwarded-For': `10.9.${Math.floor(++ip / 250)}.${ip % 250}` });

const MAILPIT = process.env.MAILPIT_API ?? 'http://127.0.0.1:8025';

interface Mensagem {
  ID: string;
  Subject: string;
  Text: string;
  HTML: string;
  Bcc: { Address: string }[];
  To: { Address: string }[];
}

async function mensagensPara(endereco: string): Promise<Mensagem[]> {
  const r = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${endereco}"`)}`);
  const { messages } = (await r.json()) as { messages: { ID: string }[] };
  return Promise.all(
    messages.map(async (m) => (await (await fetch(`${MAILPIT}/api/v1/message/${m.ID}`)).json()) as Mensagem)
  );
}

/** Espera que chegue correio ao endereco: o envio nao e esperado pela rota. */
async function esperarCorreio(endereco: string, quantas = 1): Promise<Mensagem[]> {
  for (let i = 0; i < 40; i += 1) {
    const ms = await mensagensPara(endereco);
    if (ms.length >= quantas) return ms;
    await new Promise((r) => setTimeout(r, 250));
  }
  return mensagensPara(endereco);
}

function registar(request: APIRequestContext, dados: Record<string, unknown>) {
  return request.post('/api/auth/register', {
    headers: outroIp(),
    data: { password: 'umapassword', maiorDeIdade: true, ...dados },
    failOnStatusCode: false,
  });
}

async function entrar(browser: Browser, email: string, callbackUrl?: string) {
  const contexto = await browser.newContext();
  const page = await contexto.newPage();
  await page.goto(callbackUrl ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('umapassword');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  return { contexto, page };
}

test.beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
});
test.afterAll(async () => {
  await mongoose.disconnect();
});

const utilizadores = () => mongoose.connection.collection('users');

test.describe('contas', () => {
  test('o registo não diz a ninguém quem já tem conta', async ({ request }) => {
    const email = `enumerar-${sufixo}@exemplo.pt`;
    const primeira = await registar(request, { name: 'Primeira', email });
    const segunda = await registar(request, { name: 'Segunda', email });

    expect(primeira.status()).toBe(201);
    expect(segunda.status()).toBe(primeira.status());
    expect(await segunda.json()).toEqual(await primeira.json());

    // Uma conta so, e quem e dono do endereco fica a saber pelo correio.
    expect(await utilizadores().countDocuments({ email })).toBe(1);
    const correio = await esperarCorreio(email, 2);
    expect(correio.map((m) => m.Subject)).toContain('Já tem conta na Pétalas de Sonho');
  });

  test('o registo não aceita papel, verificação nem id à boleia', async ({ request }) => {
    const email = `promover-${sufixo}@exemplo.pt`;
    const r = await registar(request, {
      name: 'Promovida',
      email,
      role: 'ADMIN',
      emailVerified: true,
      versaoSessao: 99,
      _id: ADMIN_ID,
    });
    expect(r.status()).toBe(201);

    const u = await utilizadores().findOne({ email });
    expect(u?.role).toBe('USER');
    expect(u?.emailVerified).toBe(false);
    expect(u?.versaoSessao).toBe(0);
    expect(String(u?._id)).not.toBe(ADMIN_ID);
    // E a declaracao dos 18 anos ficou com a data do registo.
    expect(u?.maioridadeDeclaradaEm).toBeInstanceOf(Date);
  });

  test('sem a declaração dos 18 anos, não há conta', async ({ request }) => {
    const email = `menor-${sufixo}@exemplo.pt`;
    for (const maiorDeIdade of [false, 'true', 1, null]) {
      const r = await registar(request, { name: 'Menor', email, maiorDeIdade });
      expect(r.status(), JSON.stringify(maiorDeIdade)).toBe(400);
    }
    expect(await utilizadores().countDocuments({ email })).toBe(0);
  });

  test('um nome com marcação é só texto, na página e no email', async ({ request, browser }) => {
    const email = `xss-${sufixo}@exemplo.pt`;
    const nome = `<img src=x onerror="window.__atacado=1">Ana`;
    expect((await registar(request, { name: nome, email })).status()).toBe(201);

    const { contexto, page } = await entrar(browser, email);
    await expect(page).toHaveURL(/\/area-pessoal$/);
    // O nome aparece no campo do perfil, como texto e nao como marcacao.
    await expect(page.getByLabel('Nome', { exact: true })).toHaveValue(nome);
    expect(await page.evaluate(() => (window as { __atacado?: number }).__atacado)).toBeUndefined();
    expect(await page.locator('img[src="x"]').count()).toBe(0);
    await contexto.close();

    const [verificacao] = await esperarCorreio(email);
    expect(verificacao.HTML).toBe('');
    expect(verificacao.Text).toContain(nome);
  });

  test('depois de entrar, só se vai para páginas deste sítio', async ({ request, browser }) => {
    const email = `redirecionar-${sufixo}@exemplo.pt`;
    await registar(request, { name: 'Ana', email });

    for (const destino of ['https://exemplo.org/entrar', '//exemplo.org', '/\\exemplo.org']) {
      const { contexto, page } = await entrar(browser, email, destino);
      await expect(page).toHaveURL(`${BASE}/area-pessoal`);
      await contexto.close();
    }
  });

  test('o cookie da sessão não se lê por JavaScript nem vai noutros sítios', async ({ request, browser }) => {
    const email = `cookie-${sufixo}@exemplo.pt`;
    await registar(request, { name: 'Ana', email });
    const { contexto, page } = await entrar(browser, email);
    await expect(page).toHaveURL(/\/area-pessoal$/);

    const sessao = (await contexto.cookies()).find((c) => c.name.endsWith('next-auth.session-token'));
    expect(sessao?.httpOnly).toBe(true);
    expect(sessao?.sameSite).toBe('Lax');
    // `Secure` e o prefixo `__Secure-` so aparecem em https, que e o que o
    // NextAuth faz quando o NEXTAUTH_URL e https: aqui o servidor e http.
    expect(await page.evaluate(() => document.cookie)).not.toContain('session-token');
    await contexto.close();
  });

  test('credenciais com operadores do Mongo não entram', async ({ request }) => {
    const { csrfToken } = await (await request.get('/api/auth/csrf')).json();
    for (const email of ['{"$ne":null}', '{"$gt":""}']) {
      const r = await request.post('/api/auth/callback/credentials', {
        headers: outroIp(),
        form: { csrfToken, email, password: 'x', json: 'true' },
        maxRedirects: 0,
        failOnStatusCode: false,
      });
      const cookies = r.headers()['set-cookie'] ?? '';
      expect(cookies, email).not.toContain('session-token');
    }
    const r = await request.post('/api/auth/callback/credentials', {
      headers: { ...outroIp(), 'Content-Type': 'application/x-www-form-urlencoded' },
      data: `csrfToken=${csrfToken}&email[$ne]=x&password[$ne]=x&json=true`,
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect(r.headers()['set-cookie'] ?? '').not.toContain('session-token');
  });
});

test.describe('a idade de quem entrou pela Google', () => {
  test('sem declarar, a área pessoal fica fechada; declarar abre-a e não muda mais nada', async ({ browser }) => {
    const contexto = await browser.newContext();
    await iniciarSessao(contexto, 'USER', { base: BASE, userId: SEM_IDADE_ID, maior: false });
    const page = await contexto.newPage();

    await page.goto('/area-pessoal');
    await expect(page).toHaveURL(/\/auth\/maioridade$/);

    const api = contexto.request;
    for (const corpo of [{ maiorDeIdade: false }, { maiorDeIdade: 'true' }, { maiorDeIdade: true, role: 'ADMIN' }]) {
      const r = await api.post('/api/conta/maioridade', { data: corpo, failOnStatusCode: false });
      expect(r.status(), JSON.stringify(corpo)).toBe(400);
    }
    expect((await utilizadores().findOne({ _id: new mongoose.Types.ObjectId(SEM_IDADE_ID) }))?.maioridadeDeclaradaEm).toBeUndefined();

    await page.getByLabel('Tenho 18 anos ou mais').check();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/area-pessoal$/);

    const u = await utilizadores().findOne({ _id: new mongoose.Types.ObjectId(SEM_IDADE_ID) });
    expect(u?.maioridadeDeclaradaEm).toBeInstanceOf(Date);
    expect(u?.role).toBe('USER');
    await contexto.close();
  });

  test('uma sessão forjada com a declaração não a faz: vem da base de dados', async ({ browser }) => {
    const id = new mongoose.Types.ObjectId();
    await utilizadores().insertOne({
      _id: id, name: 'Forja', email: `forja-${sufixo}@exemplo.pt`, role: 'USER',
      emailVerified: true, country: 'Portugal', versaoSessao: 0,
    });
    const contexto = await browser.newContext();
    // O token diz `maior: true`, mas a conta nao declarou.
    await iniciarSessao(contexto, 'USER', { base: BASE, userId: String(id), maior: true });
    const page = await contexto.newPage();
    await page.goto('/area-pessoal');
    await expect(page).toHaveURL(/\/auth\/maioridade$/);
    await contexto.close();
  });
});

test.describe('isolamento entre contas', () => {
  test('exportar os dados dá só os meus, sem segredos', async ({ browser }) => {
    const contexto = await browser.newContext();
    await iniciarSessao(contexto, 'USER', { base: BASE, userId: CLIENTE_ID });
    const r = await contexto.request.get('/api/conta/dados');
    expect(r.status()).toBe(200);
    const texto = await r.text();
    expect(texto).toContain('cliente@exemplo.pt');
    expect(texto).not.toContain('admin@exemplo.pt');
    // A palavra-passe cifrada e a chave das encomendas nao sao dados que a
    // pessoa possa usar, e sao os que um atacante queria.
    expect(texto).not.toMatch(/"password"|chaveHash|\$argon2|\$2[aby]\$/);
    await contexto.close();
  });

  test('mudar o nome não deixa escolher a conta nem o papel', async ({ browser }) => {
    const contexto = await browser.newContext();
    await iniciarSessao(contexto, 'USER', { base: BASE, userId: CLIENTE_ID });
    const api = contexto.request;
    for (const corpo of [
      { name: 'Hacker', _id: ADMIN_ID },
      { name: 'Hacker', userId: ADMIN_ID },
      { name: 'Hacker', role: 'ADMIN' },
      { name: 'Hacker', email: 'admin@exemplo.pt' },
    ]) {
      const r = await api.patch('/api/conta', { data: corpo, failOnStatusCode: false });
      expect(r.status(), JSON.stringify(corpo)).toBe(400);
    }
    const admin = await utilizadores().findOne({ _id: new mongoose.Types.ObjectId(ADMIN_ID) });
    expect(admin?.name).toBe('Administração');
    const cliente = await utilizadores().findOne({ _id: new mongoose.Types.ObjectId(CLIENTE_ID) });
    expect(cliente?.role).toBe('USER');
    await contexto.close();
  });

  test('um formulário de outro sítio não muda nada, mesmo com a sessão', async ({ browser }) => {
    const contexto = await browser.newContext();
    await iniciarSessao(contexto, 'USER', { base: BASE, userId: CLIENTE_ID });
    // O corpo que um `<form enctype="text/plain">` produz com um campo de
    // nome `{"name":"CSRF` e valor `"}`: o browser junta-os com um `=`, e o
    // resultado e JSON valido, com um nome que o esquema aceita.
    const r = await contexto.request.patch('/api/conta', {
      headers: { 'Content-Type': 'text/plain' },
      data: '{"name":"CSRF="}',
      failOnStatusCode: false,
    });
    expect(r.status()).toBe(400);
    expect((await utilizadores().findOne({ _id: new mongoose.Types.ObjectId(CLIENTE_ID) }))?.name).not.toBe('CSRF=');
    await contexto.close();
  });

  test('um cliente com um token que diz ADMIN continua cliente', async ({ browser }) => {
    const contexto = await browser.newContext();
    // Assinado com o segredo certo e com o papel errado: o papel vem da conta.
    await iniciarSessao(contexto, 'ADMIN', { base: BASE, userId: CLIENTE_ID });
    const r = await contexto.request.get('/api/admin/produtos', { failOnStatusCode: false });
    expect(r.status()).toBe(403);
    expect((await (await contexto.newPage()).goto('/admin'))?.status()).toBe(404);
    await contexto.close();
  });

  test('um token assinado com outro segredo não é sessão nenhuma', async ({ browser }) => {
    const contexto = await browser.newContext();
    const valor = await encode({
      token: { userId: ADMIN_ID, role: 'ADMIN', versao: 0, maior: true },
      secret: 'um-segredo-que-o-servidor-nao-conhece',
    });
    await contexto.addCookies([{ name: 'next-auth.session-token', value: valor, url: BASE, httpOnly: true, sameSite: 'Lax' }]);
    expect((await contexto.request.get('/api/conta/dados', { failOnStatusCode: false })).status()).toBe(401);
    expect((await contexto.request.get('/api/admin/produtos', { failOnStatusCode: false })).status()).toBe(401);
    await contexto.close();
  });

  test('sem sessão, e sem ser administrador, nenhuma rota do painel responde', async ({ browser }) => {
    const anonimo = await browser.newContext();
    const cliente = await browser.newContext();
    await iniciarSessao(cliente, 'USER', { base: BASE, userId: CLIENTE_ID });
    const id = 'ab'.repeat(12);
    const rotas: [string, string][] = [
      ['GET', '/api/admin/produtos'],
      ['POST', '/api/admin/produtos'],
      ['PATCH', `/api/admin/produtos/${id}`],
      ['GET', `/api/admin/produtos/${id}/stock`],
      ['POST', `/api/admin/produtos/${id}/stock`],
      ['GET', '/api/admin/categorias'],
      ['POST', '/api/admin/categorias'],
      ['PATCH', `/api/admin/categorias/${id}`],
      ['PATCH', `/api/admin/encomendas/${id}`],
    ];
    for (const [metodo, rota] of rotas) {
      const a = await anonimo.request.fetch(rota, { method: metodo, data: {}, failOnStatusCode: false });
      const c = await cliente.request.fetch(rota, { method: metodo, data: {}, failOnStatusCode: false });
      // 405 e o Next a dizer que o metodo nao existe: tambem nao abre nada.
      expect([401, 405], `${metodo} ${rota} sem sessão`).toContain(a.status());
      expect([403, 405], `${metodo} ${rota} como cliente`).toContain(c.status());
    }
    for (const pagina of ['/admin', '/admin/produtos', '/admin/encomendas', '/admin/categorias']) {
      expect((await (await cliente.newPage()).goto(pagina))?.status(), pagina).toBe(404);
    }
    await anonimo.close();
    await cliente.close();
  });
});

test.describe('encomendas de outras pessoas', () => {
  test('a chave de uma encomenda não abre outra', async ({ browser, page, request }) => {
    const encomendas = mongoose.connection.collection('orders');
    const hash = (c: string) => createHash('sha256').update(c).digest('hex');

    /** Uma encomenda a serio, pela API, de uma peca criada para ela. */
    async function encomenda(n: string, chave: string) {
      const admin = await browser.newContext();
      await iniciarSessao(admin, 'ADMIN', { base: BASE, userId: ADMIN_ID });
      const c = await admin.request.post('/api/admin/categorias', {
        data: { name: `Chaves ${sufixo}${n}`, slug: `chaves-${sufixo}${n}`, pecasUnicas: true },
      });
      const p = await admin.request.post('/api/admin/produtos', {
        data: {
          name: `Pedra ${sufixo}${n}`, slug: `pedra-${sufixo}${n}`, priceCents: 1000, weightGrams: 100,
          categoryId: (await c.json()).id, images: [], featured: false, active: true, variantes: [{ stock: 1 }],
        },
      });
      const id: string = (await p.json()).id;
      await admin.close();

      const linhas = [{ id, quantidade: 1 }];
      const { totalCents } = await (await request.post('/api/encomendas/orcamento', { headers: outroIp(), data: { linhas } })).json();
      const r = await request.post('/api/encomendas', {
        headers: outroIp(),
        data: {
          linhas,
          entrega: 'SHIPPING',
          totalVistoCents: totalCents,
          cliente: {
            nome: 'Ana', email: 'ana@exemplo.pt', telefone: '912345678', morada: 'Rua 1',
            codigoPostal: '4000-123', localidade: 'Porto',
          },
        },
      });
      expect(r.status()).toBe(201);
      const e = (await encomendas.findOne({ 'items.productId': new mongoose.Types.ObjectId(id) }))!;
      // A chave verdadeira so vai para a Stripe; o teste poe uma que conhece.
      await encomendas.updateOne({ _id: e._id }, { $set: { chaveHash: hash(chave) } });
      return String(e._id);
    }

    const chaveA = 'A'.repeat(43);
    const a = await encomenda('a', chaveA);
    const b = await encomenda('b', 'B'.repeat(43));

    expect((await page.goto(`/encomenda/${a}?chave=${chaveA}`))?.status()).toBe(200);
    expect((await page.goto(`/encomenda/${b}?chave=${chaveA}`))?.status()).toBe(404);
    expect((await page.goto(`/encomenda/${b}?chave=${encodeURIComponent('{"$ne":null}')}`))?.status()).toBe(404);
    expect((await page.goto(`/encomenda/${b}?chave[$ne]=x`))?.status()).toBe(404);

    const desistir = await request.post(`/api/encomendas/${b}/desistir`, {
      headers: outroIp(),
      data: { chave: chaveA },
      failOnStatusCode: false,
    });
    expect(desistir.status()).toBe(404);
    expect((await encomendas.findOne({ _id: new mongoose.Types.ObjectId(b) }))?.status).toBe('PENDING');
  });

  test('a encomenda não aceita preços, quantidades negativas nem campos a mais', async ({ request }) => {
    const id = 'ab'.repeat(12);
    const cliente = {
      nome: 'Ana', email: 'ana@exemplo.pt', telefone: '912345678', morada: 'Rua 1',
      codigoPostal: '4000-123', localidade: 'Porto',
    };
    const corpos = [
      { linhas: [{ id, quantidade: 1, priceCents: 1 }], cliente, entrega: 'SHIPPING', totalVistoCents: 1 },
      { linhas: [{ id, quantidade: -1 }], cliente, entrega: 'SHIPPING', totalVistoCents: 0 },
      { linhas: [{ id, quantidade: 1.5 }], cliente, entrega: 'SHIPPING', totalVistoCents: 0 },
      { linhas: [{ id, quantidade: 1 }], cliente: { ...cliente, userId: ADMIN_ID }, entrega: 'SHIPPING', totalVistoCents: 0 },
      { linhas: [{ id, quantidade: 1 }], cliente, entrega: 'PICKUP', totalVistoCents: 0 },
      { linhas: [{ id, quantidade: 1 }], cliente, entrega: 'SHIPPING', totalVistoCents: 0, status: 'SHIPPED' },
      { linhas: [{ id: { $ne: null }, quantidade: 1 }], cliente, entrega: 'SHIPPING', totalVistoCents: 0 },
    ];
    for (const data of corpos) {
      const r = await request.post('/api/encomendas', { headers: outroIp(), data, failOnStatusCode: false });
      expect(r.status(), JSON.stringify(data)).toBe(400);
    }
  });
});

test.describe('as fotografias do painel', () => {
  const jpeg = () =>
    sharp({ create: { width: 20, height: 20, channels: 3, background: { r: 1, g: 2, b: 3 } } }).jpeg().toBuffer();

  async function comPapel(browser: Browser, papel: 'ADMIN' | 'USER', userId: string) {
    const contexto = await browser.newContext({ baseURL: BASE });
    await iniciarSessao(contexto, papel, { base: BASE, userId });
    return contexto;
  }

  test('sem sessão, ou com a de um cliente, não se carrega nada', async ({ browser, request }) => {
    const anonimo = await request.post('/api/admin/imagens', {
      headers: { ...outroIp(), 'Content-Type': 'image/jpeg' },
      data: await jpeg(),
      failOnStatusCode: false,
    });
    expect([401, 403]).toContain(anonimo.status());

    const cliente = await comPapel(browser, 'USER', CLIENTE_ID);
    const r = await cliente.request.post('/api/admin/imagens', {
      headers: { 'Content-Type': 'image/jpeg' },
      data: await jpeg(),
      failOnStatusCode: false,
    });
    expect(r.status()).toBe(403);
    await cliente.close();
  });

  test('só com um tipo de imagem: um formulário de outro sítio não consegue enviar uma', async ({ browser }) => {
    const admin = await comPapel(browser, 'ADMIN', ADMIN_ID);
    // `multipart` e `text/plain` sao o que um <form> de outro sitio envia
    // sem o browser pedir autorizacao primeiro.
    for (const tipo of ['multipart/form-data; boundary=x', 'text/plain', 'application/x-www-form-urlencoded', 'image/svg+xml']) {
      const r = await admin.request.post('/api/admin/imagens', {
        headers: { 'Content-Type': tipo },
        data: await jpeg(),
        failOnStatusCode: false,
      });
      expect(r.status(), tipo).toBe(415);
    }
    await admin.close();
  });

  test('o que diz ser JPEG e não é, recusa-se; e acima de 10 MB nem se abre', async ({ browser }) => {
    const admin = await comPapel(browser, 'ADMIN', ADMIN_ID);
    const falso = await admin.request.post('/api/admin/imagens', {
      headers: { 'Content-Type': 'image/jpeg' },
      data: Buffer.from('<html><script>alert(1)</script></html>'),
      failOnStatusCode: false,
    });
    expect(falso.status()).toBe(400);

    const enorme = await admin.request.post('/api/admin/imagens', {
      headers: { 'Content-Type': 'image/jpeg' },
      data: Buffer.alloc(10 * 1024 * 1024 + 1),
      failOnStatusCode: false,
    });
    expect(enorme.status()).toBe(413);

    const bom = await admin.request.post('/api/admin/imagens', {
      headers: { 'Content-Type': 'image/jpeg' },
      data: await jpeg(),
    });
    expect(bom.status()).toBe(201);
    expect((await bom.json()).caminho).toMatch(/^\/imagens\/[a-f0-9]{64}\.webp$/);
    await admin.close();
  });

  test('servir só lê nomes que o painel dá: nada de caminhos', async ({ request }) => {
    for (const mau of [
      '/imagens/..%2F..%2Fpackage.json',
      '/imagens/%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '/imagens/..%5C..%5Cpackage.json',
      `/imagens/${'a'.repeat(64)}.png`,
      `/imagens/${'f'.repeat(64)}.webp`,
    ]) {
      const r = await request.get(mau, { headers: outroIp(), failOnStatusCode: false });
      expect(r.status(), mau).toBe(404);
      expect(await r.text(), mau).not.toContain('"name"');
    }
  });
});

test.describe('a API pública', () => {
  test('injeção nos parâmetros do catálogo não passa', async ({ request }) => {
    for (const q of ['category[$ne]=x', 'category={"$ne":null}', 'sort=__proto__', 'sort=constructor', 'limit=-1', 'limit=1e9']) {
      const r = await request.get(`/api/products?${q}`, { headers: outroIp() });
      expect(r.status(), q).toBe(200);
    }
    for (const slug of ['{"$ne":null}', '..%2F..%2Fetc%2Fpasswd', '%00', "' OR '1'='1"]) {
      const r = await request.get(`/api/products/${encodeURIComponent(slug)}`, { headers: outroIp(), failOnStatusCode: false });
      expect(r.status(), slug).toBe(404);
    }
  });

  test('os produtos só trazem o que a loja mostra', async ({ browser, request }) => {
    const admin = await browser.newContext();
    await iniciarSessao(admin, 'ADMIN', { base: BASE, userId: ADMIN_ID });
    const c = await admin.request.post('/api/admin/categorias', {
      data: { name: `Ataque ${sufixo}`, slug: `ataque-${sufixo}`, pecasUnicas: true },
    });
    await admin.request.post('/api/admin/produtos', {
      data: {
        name: `Quartzo ${sufixo}`, slug: `quartzo-atq-${sufixo}`, priceCents: 1000, weightGrams: 100,
        categoryId: (await c.json()).id, images: [], featured: false, active: true, variantes: [{ stock: 1 }],
      },
    });
    await admin.close();

    const lista = (await (await request.get('/api/products', { headers: outroIp() })).json()) as Record<string, unknown>[];
    const um = (await (await request.get(`/api/products/quartzo-atq-${sufixo}`, { headers: outroIp() })).json()) as Record<string, unknown>;
    const permitidos = new Set([
      '_id', 'name', 'slug', 'description', 'priceCents', 'images', 'variantes', 'categoryId',
      'featured', 'weightGrams', 'dimensions', 'properties', 'stock',
    ]);
    for (const p of [...lista, um]) {
      const a_mais = Object.keys(p).filter((k) => !permitidos.has(k));
      expect(a_mais, String(p.slug)).toEqual([]);
    }
  });

  test('um erro não mostra pormenores do servidor', async ({ request }) => {
    const r = await request.post('/api/contact', {
      headers: { ...outroIp(), 'Content-Type': 'application/json' },
      data: Buffer.from('{"name": '),
      failOnStatusCode: false,
    });
    expect(r.status()).toBe(400);
    expect(await r.json()).toEqual({ error: 'Corpo do pedido inválido.' });
  });
});

test.describe('o formulário de contacto', () => {
  test('só chega à loja, em texto, e uma quebra de linha não abre cabeçalhos', async ({ request }) => {
    const email = `contacto-${sufixo}@exemplo.pt`;
    const r = await request.post('/api/contact', {
      headers: outroIp(),
      data: {
        name: 'Ana\r\nBcc: vitima@exemplo.pt',
        email,
        subject: 'outro',
        message: '<script>alert(1)</script>\r\nBcc: vitima@exemplo.pt',
      },
    });
    expect(r.status()).toBe(200);

    const recebidas = (await esperarCorreio('loja@exemplo.pt')).filter((m) => m.Text.includes(email));
    expect(recebidas).toHaveLength(1);
    const [m] = recebidas;
    expect(m.Subject).toBe('Contacto do site: Outro');
    expect(m.HTML).toBe('');
    expect(m.Bcc ?? []).toEqual([]);
    expect(m.To.map((t) => t.Address)).toEqual(['loja@exemplo.pt']);
    expect(await mensagensPara('vitima@exemplo.pt')).toEqual([]);
    expect(await mensagensPara(email)).toEqual([]);
  });

  test('a armadilha: quem preenche o campo escondido não envia nada', async ({ request }) => {
    const email = `robo-${sufixo}@exemplo.pt`;
    const r = await request.post('/api/contact', {
      headers: outroIp(),
      data: { name: 'Robô', email, subject: 'outro', message: 'compre já', sitio: 'https://spam.exemplo' },
    });
    // Responde como se tivesse corrido bem, para o programa nao aprender.
    expect(r.status()).toBe(200);
    await new Promise((res) => setTimeout(res, 1500));
    const lojas = await mensagensPara('loja@exemplo.pt');
    expect(lojas.filter((m) => m.Text.includes(email))).toEqual([]);
  });
});
