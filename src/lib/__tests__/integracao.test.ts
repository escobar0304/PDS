import { hash, verify } from 'argon2';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Category, Contador, MovimentoStock, Order, Product, Token, User } from '../models';
import { moverStock } from '../stock';
import {
  PRAZO_RESERVA_MS,
  calcularEncomenda,
  criarEncomenda,
  libertarReservasExpiradas,
  mudarEstado,
  proximoNumero,
  reservarStock,
  type DadosCliente,
} from '../encomenda';
import { apagarConta, exportarDados } from '../conta';
import { expiraEm, gerarToken, resumir } from '../tokens';

/**
 * Testes contra uma base de dados a serio.
 *
 * Tudo o resto nesta suite corre sem base de dados, de proposito: prova que o
 * site nao rebenta com ela em baixo. Mas prova **zero** sobre funcionar com
 * ela — e ate aqui nada neste projeto tinha alguma vez criado um utilizador,
 * gerado um token ou verificado uma palavra-passe contra o Mongo.
 *
 * Estes testes fecham esse buraco. Sao ignorados quando `MONGODB_URI` nao
 * existe, para `npm test` continuar a correr em qualquer maquina; o CI levanta
 * um Mongo em contentor e ai correm mesmo.
 *
 * Testam o que atravessa a fronteira entre o codigo e a base de dados:
 * indices unicos, tipos que o Mongoose converte, prazos, e o ciclo completo
 * de uma palavra-passe. Nao testam as rotas HTTP — essas estao em `e2e/`.
 */

const URI = process.env.MONGODB_URI;
const executar = URI ? describe : describe.skip;

/**
 * Prova de que a suite correu mesmo.
 *
 * Um `describe.skip` nao falha: o CI fica verde na mesma. Se `MONGODB_URI`
 * deixasse de chegar ao processo — um erro de nome, um job mal configurado —
 * estes testes desapareciam em silencio e continuariamos a dizer que o codigo
 * esta verificado contra uma base de dados. O teste no fim do ficheiro apanha
 * exactamente isso.
 */
let ligou = false;

executar('contra MongoDB', () => {
  beforeAll(async () => {
    await mongoose.connect(URI as string, { dbName: 'pds-testes' });
    ligou = true;
  }, 30_000);

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Token.deleteMany({}), Order.deleteMany({})]);
    const bd = mongoose.connection.db;
    if (bd) {
      await Promise.all([
        bd.collection('accounts').deleteMany({}),
        bd.collection('sessions').deleteMany({}),
      ]);
    }
  });

  describe('utilizadores', () => {
    it('cria um utilizador com os valores por omissão certos', async () => {
      const u = await User.create({
        name: 'Marta Ferreira',
        email: 'marta@exemplo.pt',
        password: await hash('umapassword', { type: 2 }),
      });

      expect(u.role).toBe('USER');
      // Nasce por verificar. Ate a F11.3 nada punha isto a true, e o valor
      // por omissao era a unica parte do mecanismo que existia.
      expect(u.emailVerified).toBe(false);
      expect(u.country).toBe('Portugal');
      expect(u.createdAt).toBeInstanceOf(Date);
    });

    it('não deixa duas contas com o mesmo email', async () => {
      const base = { name: 'A', password: await hash('umapassword', { type: 2 }) };
      await User.create({ ...base, email: 'repetido@exemplo.pt' });

      // O indice unico so existe depois de o Mongoose o sincronizar.
      await User.syncIndexes();

      await expect(
        User.create({ ...base, email: 'repetido@exemplo.pt' }),
      ).rejects.toThrow();
    });

    it('normaliza o email para minúsculas ao guardar', async () => {
      const u = await User.create({
        name: 'A',
        email: 'MAIUSCULAS@Exemplo.PT',
        password: await hash('umapassword', { type: 2 }),
      });

      // Sem isto, `findOne({ email })` com o email em minusculas nao
      // encontrava a conta criada com maiusculas, e a pessoa ficava sem
      // conseguir entrar sem perceber porque.
      expect(u.email).toBe('maiusculas@exemplo.pt');
    });

    it('a palavra-passe cifrada verifica e a errada não', async () => {
      const cifrada = await hash('aPasswordCerta', { type: 2 });
      await User.create({ name: 'A', email: 'v@exemplo.pt', password: cifrada });

      const lido = await User.findOne({ email: 'v@exemplo.pt' });

      expect(lido).not.toBeNull();
      expect(lido!.password).not.toContain('aPasswordCerta');
      expect(await verify(lido!.password!, 'aPasswordCerta')).toBe(true);
      expect(await verify(lido!.password!, 'aPasswordErrada')).toBe(false);
    });

    it('uma consulta com operador do Mongo não devolve utilizador nenhum', async () => {
      await User.create({
        name: 'A',
        email: 'alvo@exemplo.pt',
        password: await hash('umapassword', { type: 2 }),
      });

      // Isto é o que a injeção NoSQL fazia chegar à consulta antes da F11.2.
      // Aqui prova-se o dano real: sem validação, devolvia uma conta.
      const comOperador = await User.findOne({ email: { $ne: null } as never });
      expect(comOperador, 'o operador encontra uma conta qualquer').not.toBeNull();

      // E com o valor já validado como texto, não encontra nada.
      const comTexto = await User.findOne({ email: '{"$ne":null}' });
      expect(comTexto).toBeNull();
    });
  });

  describe('tokens', () => {
    it('guarda o resumo e nunca o token', async () => {
      const u = await User.create({
        name: 'A',
        email: 't@exemplo.pt',
        password: await hash('umapassword', { type: 2 }),
      });

      const token = gerarToken();
      await Token.create({
        resumo: resumir(token),
        userId: u._id,
        finalidade: 'verificar-email',
        expiraEm: expiraEm('verificar-email'),
      });

      const guardado = await Token.findOne({ userId: u._id });

      expect(guardado).not.toBeNull();
      expect(guardado!.resumo).not.toBe(token);
      // Quem leia a base de dados tem de ficar sem nada de util.
      expect(JSON.stringify(guardado!.toObject())).not.toContain(token);
    });

    it('encontra-se pelo resumo, que é como as rotas o procuram', async () => {
      const u = await User.create({
        name: 'A',
        email: 't2@exemplo.pt',
        password: await hash('umapassword', { type: 2 }),
      });

      const token = gerarToken();
      await Token.create({
        resumo: resumir(token),
        userId: u._id,
        finalidade: 'repor-password',
        expiraEm: expiraEm('repor-password'),
      });

      expect(await Token.findOne({ resumo: resumir(token) })).not.toBeNull();
      expect(await Token.findOne({ resumo: resumir(gerarToken()) })).toBeNull();
    });

    it('não aceita dois registos com o mesmo resumo', async () => {
      const u = await User.create({
        name: 'A',
        email: 't3@exemplo.pt',
        password: await hash('umapassword', { type: 2 }),
      });
      await Token.syncIndexes();

      const comum = { resumo: resumir('x'), userId: u._id, finalidade: 'repor-password' as const };
      await Token.create({ ...comum, expiraEm: expiraEm('repor-password') });

      await expect(
        Token.create({ ...comum, expiraEm: expiraEm('repor-password') }),
      ).rejects.toThrow();
    });

    it('o prazo guardado é o que a rota vai comparar', async () => {
      const u = await User.create({
        name: 'A',
        email: 't4@exemplo.pt',
        password: await hash('umapassword', { type: 2 }),
      });

      const antes = Date.now();
      const t = await Token.create({
        resumo: resumir(gerarToken()),
        userId: u._id,
        finalidade: 'repor-password',
        expiraEm: expiraEm('repor-password', antes),
      });

      const lido = await Token.findById(t._id);

      // A rota faz `expiraEm.getTime() <= Date.now()`. Se o Mongo devolvesse
      // outra coisa que nao um Date, essa comparacao dava sempre falso e o
      // token nunca expirava.
      expect(lido!.expiraEm).toBeInstanceOf(Date);
      expect(lido!.expiraEm.getTime()).toBe(antes + 60 * 60 * 1000);
    });
  });

    describe('os direitos do titular sobre a propria conta', () => {
    async function conta(email: string) {
      return User.create({
        name: 'Marta Ferreira',
        email,
        password: await hash('umapassword', { type: 2 }),
        phone: '910000000',
      });
    }

    /**
     * Uma encomenda que o `orderSchema` aceita. A primeira versao destes
     * testes criava encomendas so com `userId`, `status` e `total`, e o
     * Mongoose recusava-as todas — os campos do cliente, o tipo de entrega, o
     * subtotal e as linhas sao obrigatorios. Foi o CI que o disse.
     */
    function encomenda(userId: mongoose.Types.ObjectId, total: number) {
      return Order.create({
        numero: `2026-${new mongoose.Types.ObjectId()}`,
        userId,
        customerName: 'Marta Ferreira',
        customerEmail: 'marta@exemplo.pt',
        customerPhone: '910000000',
        deliveryType: 'PICKUP',
        subtotalCents: total,
        totalCents: total,
        items: [
          { productId: new mongoose.Types.ObjectId(), varianteId: new mongoose.Types.ObjectId(), name: 'Quartzo rosa', priceCents: total, quantity: 1 },
        ],
      });
    }

    it('a exportacao nunca inclui a palavra-passe cifrada', async () => {
      const u = await conta('exportar@exemplo.pt');

      const dados = await exportarDados(u._id.toString());

      expect(dados).not.toBeNull();
      expect(dados!.conta.email).toBe('exportar@exemplo.pt');
      expect(dados!.conta.phone).toBe('910000000');
      // Um hash argon2 num ficheiro que vai parar aos downloads da a quem o
      // apanhe material para atacar offline, e ao titular nao serve de nada.
      expect(dados!.conta.password).toBeUndefined();
      expect(JSON.stringify(dados)).not.toContain('$argon2');
    });

    it('a exportacao so traz as encomendas de quem pede', async () => {
      const eu = await conta('eu@exemplo.pt');
      const outro = await conta('outro@exemplo.pt');

      await encomenda(eu._id, 1000);
      await encomenda(outro._id, 9900);

      const dados = await exportarDados(eu._id.toString());

      // Nao procurar "99" no JSON: ids e datas sao aleatorios e contem-no por
      // acaso. Compara-se o dono e o valor.
      expect(dados!.encomendas).toHaveLength(1);
      expect(dados!.encomendas[0].totalCents).toBe(1000);
      expect(String(dados!.encomendas[0].userId)).toBe(eu._id.toString());
    });

    it('um id que nao existe devolve nulo, e um id malformado tambem', async () => {
      expect(await exportarDados(new mongoose.Types.ObjectId().toString())).toBeNull();
      // Sem esta guarda, o Mongoose lanca e a rota devolvia 500 em vez de 404.
      expect(await exportarDados('nao-e-um-id')).toBeNull();
      expect(await apagarConta('nao-e-um-id')).toBeNull();
    });

    it('apagar limpa **todas** as coleccoes, nao so o utilizador', async () => {
      const u = await conta('apagar@exemplo.pt');
      const bd = mongoose.connection.db!;

      await Token.create({
        resumo: resumir(gerarToken()),
        userId: u._id,
        finalidade: 'repor-password',
        expiraEm: expiraEm('repor-password'),
      });
      await bd.collection('accounts').insertOne({ userId: u._id, provider: 'google' });
      await bd.collection('sessions').insertOne({ userId: u._id, sessionToken: 'x' });

      const r = await apagarConta(u._id.toString());

      expect(r).not.toBeNull();
      expect(await User.findById(u._id)).toBeNull();
      // Deixar qualquer uma para tras e deixar dados pessoais para tras — e um
      // token de reposicao vivo para uma conta que ja nao existe.
      expect(await Token.countDocuments({ userId: u._id })).toBe(0);
      expect(await bd.collection('accounts').countDocuments({ userId: u._id })).toBe(0);
      expect(await bd.collection('sessions').countDocuments({ userId: u._id })).toBe(0);
    });

    it('apagar nao destroi encomendas: desliga-as da conta', async () => {
      const u = await conta('fiscal@exemplo.pt');
      const e = await encomenda(u._id, 4200);

      await apagarConta(u._id.toString());

      const depois = await Order.findById(e._id);
      // A conservacao fiscal dos documentos de venda sobrepoe-se ao direito ao
      // apagamento (art. 17.º, n.º 3, alinea b). A encomenda fica, sem dono.
      expect(depois).not.toBeNull();
      expect(depois!.totalCents).toBe(4200);
      expect(depois!.userId).toBeUndefined();
      // E fica com o nome e o email de quem comprou: o documento fiscal
      // precisa deles. Desligar da conta nao anonimiza — este teste existe
      // para ninguem voltar a escrever que sim.
      expect(depois!.customerEmail).toBe('marta@exemplo.pt');
    });

    it('apagar uma conta nao toca na de mais ninguem', async () => {
      const eu = await conta('some@exemplo.pt');
      const outro = await conta('fica@exemplo.pt');
      await Token.create({
        resumo: resumir(gerarToken()),
        userId: outro._id,
        finalidade: 'verificar-email',
        expiraEm: expiraEm('verificar-email'),
      });

      await apagarConta(eu._id.toString());

      expect(await User.findById(outro._id)).not.toBeNull();
      expect(await Token.countDocuments({ userId: outro._id })).toBe(1);
    });

    it('apagar duas vezes a mesma conta nao rebenta', async () => {
      const u = await conta('duas@exemplo.pt');

      expect(await apagarConta(u._id.toString())).not.toBeNull();
      // Acontece a quem carregue duas vezes, ou com o JWT ainda em maos.
      expect(await apagarConta(u._id.toString())).toBeNull();
    });
  });

  describe('o ciclo completo de repor a palavra-passe', () => {
    it('gera, consome uma vez, e a segunda já não encontra nada', async () => {
      const u = await User.create({
        name: 'Marta',
        email: 'ciclo@exemplo.pt',
        password: await hash('aVelha', { type: 2 }),
      });

      // 1. Pedido: gera-se o token e guarda-se o resumo.
      const token = gerarToken();
      await Token.create({
        resumo: resumir(token),
        userId: u._id,
        finalidade: 'repor-password',
        expiraEm: expiraEm('repor-password'),
      });

      // 2. Uso: encontra-se pelo resumo, muda-se a palavra-passe.
      const registo = await Token.findOne({
        resumo: resumir(token),
        finalidade: 'repor-password',
      });
      expect(registo).not.toBeNull();
      expect(registo!.expiraEm.getTime()).toBeGreaterThan(Date.now());

      const dono = await User.findById(registo!.userId);
      dono!.password = await hash('aNova', { type: 2 });
      dono!.emailVerified = true;
      await dono!.save();
      await Token.deleteMany({ userId: dono!._id, finalidade: 'repor-password' });

      // 3. A palavra-passe nova funciona e a antiga deixou de funcionar.
      const depois = await User.findById(u._id);
      expect(await verify(depois!.password!, 'aNova')).toBe(true);
      expect(await verify(depois!.password!, 'aVelha')).toBe(false);
      // Repor prova que se controla a caixa de correio, o que confirma o email.
      expect(depois!.emailVerified).toBe(true);

      // 4. Uso unico: a segunda tentativa nao encontra nada.
      expect(
        await Token.findOne({ resumo: resumir(token), finalidade: 'repor-password' }),
      ).toBeNull();
    });

    it('um token expirado é encontrado mas rejeitado pelo prazo', async () => {
      const u = await User.create({
        name: 'A',
        email: 'expirado@exemplo.pt',
        password: await hash('umapassword', { type: 2 }),
      });

      const token = gerarToken();
      await Token.create({
        resumo: resumir(token),
        userId: u._id,
        finalidade: 'repor-password',
        expiraEm: new Date(Date.now() - 1000),
      });

      const registo = await Token.findOne({ resumo: resumir(token) });

      // O indice de expiracao do Mongo corre periodicamente e pode deixar um
      // token vencido vivo durante minutos. E por isso que a rota verifica o
      // prazo em codigo, e nao confia no indice.
      expect(registo, 'o índice do Mongo ainda não o apagou').not.toBeNull();
      expect(registo!.expiraEm.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
  describe('entrar pela Google', () => {
    const entrar = async (email: string) => {
      const { authOptions } = await import('../auth');
      return authOptions.callbacks!.signIn!({
        user: { id: 'google-sub', email, name: 'Marta Ferreira' },
        account: { provider: 'google', type: 'oauth', providerAccountId: 'google-sub' },
        profile: { email_verified: true },
      } as never);
    };

    it('a primeira entrada cria a conta, sem palavra-passe', async () => {
      // Ate aqui isto rebentava: a conta era criada com `password: ''` e o
      // Mongoose recusava-a. Ninguem conseguia entrar pela Google pela
      // primeira vez.
      expect(await entrar('Nova@Exemplo.pt')).toBe(true);

      const u = await User.findOne({ email: 'nova@exemplo.pt' });
      expect(u, 'a conta foi criada, e com o email em minúsculas').not.toBeNull();
      expect(u!.password).toBeUndefined();
      expect(u!.emailVerified).toBe(true);
    });

    it('entrar outra vez não duplica a conta', async () => {
      await entrar('repete@exemplo.pt');
      await entrar('repete@exemplo.pt');
      expect(await User.countDocuments({ email: 'repete@exemplo.pt' })).toBe(1);
    });

    it('depois de mudar o nome, a sessão lê-o da base de dados e não do cliente', async () => {
      const { authOptions } = await import('../auth');
      const u = await User.create({ name: 'Nome Novo', email: 'sessao@exemplo.pt' });

      const token = await authOptions.callbacks!.jwt!({
        token: { userId: u._id.toString(), name: 'Nome Antigo', role: 'USER' },
        trigger: 'update',
        // O que o cliente manda em `update()`. Tem de ser ignorado.
        session: { name: 'Escolhido pelo cliente', role: 'ADMIN' },
      } as never);

      expect(token.name).toBe('Nome Novo');
      expect(token.role).toBe('USER');
    });

    it('quem já tinha conta por email entra nela, e a palavra-passe fica', async () => {
      await User.create({
        name: 'Marta Ferreira',
        email: 'ambas@exemplo.pt',
        password: await hash('umapassword', { type: 2 }),
      });

      expect(await entrar('ambas@exemplo.pt')).toBe(true);

      expect(await User.countDocuments({ email: 'ambas@exemplo.pt' })).toBe(1);
      const u = await User.findOne({ email: 'ambas@exemplo.pt' });
      expect(await verify(u!.password!, 'umapassword')).toBe(true);
    });
  });
  describe('as sessões acabam quando devem', () => {
    // O token de uma sessao, tal como o callback `jwt` o recebe em cada pedido.
    const verificar = async (token: Record<string, unknown>) => {
      const { authOptions } = await import('../auth');
      return authOptions.callbacks!.jwt!({ token } as never);
    };

    it('uma sessão de uma conta que existe continua', async () => {
      const u = await User.create({ name: 'Marta', email: 'sessao-ok@exemplo.pt' });
      const t = await verificar({ userId: u._id.toString(), role: 'USER', versao: 0 });
      expect(t.userId).toBe(u._id.toString());
    });

    it('um token de antes de haver versão continua a valer', async () => {
      // Quem entrou antes desta alteracao nao tem `versao` no token. Expulsar
      // toda a gente no dia da publicacao nao era o objetivo.
      const u = await User.create({ name: 'Marta', email: 'sessao-antiga@exemplo.pt' });
      await expect(verificar({ userId: u._id.toString(), role: 'USER' })).resolves.toBeTruthy();
    });

    it('apagar a conta termina a sessão', async () => {
      const u = await User.create({ name: 'Marta', email: 'sessao-apagada@exemplo.pt' });
      const token = { userId: u._id.toString(), role: 'USER', versao: 0 };

      await apagarConta(u._id.toString());

      // Ate aqui o token valia mais 30 dias, sem conta por tras.
      await expect(verificar(token)).rejects.toThrow('Sessão revogada');
    });

    it('repor a palavra-passe termina as sessões abertas, em todos os dispositivos', async () => {
      const u = await User.create({
        name: 'Marta',
        email: 'sessao-reposta@exemplo.pt',
        password: await hash('aVelha', { type: 2 }),
      });
      const sessaoAntiga = { userId: u._id.toString(), role: 'USER', versao: 0 };
      const segredo = gerarToken();
      await Token.create({
        resumo: resumir(segredo),
        userId: u._id,
        finalidade: 'repor-password',
        expiraEm: expiraEm('repor-password'),
      });

      // A rota a serio, nao uma simulacao do que ela faz.
      const { POST } = await import('../../app/api/auth/nova-password/route');
      const r = await POST(
        new Request('http://localhost/api/auth/nova-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: segredo, password: 'umaPasswordNova1' }),
        }),
      );
      expect(r.status).toBe(200);

      const depois = await User.findById(u._id);
      expect(depois!.versaoSessao).toBe(1);
      await expect(verificar(sessaoAntiga)).rejects.toThrow('Sessão revogada');
      // Quem entra de novo recebe a versao nova e fica.
      await expect(verificar({ ...sessaoAntiga, versao: 1 })).resolves.toBeTruthy();
    });

    it('o papel vem da base de dados, não do token', async () => {
      // Sem isto, quem perdesse o papel de administrador continuava
      // administrador ate o token expirar.
      const u = await User.create({ name: 'Ex-admin', email: 'papel@exemplo.pt', role: 'USER' });
      const t = await verificar({ userId: u._id.toString(), role: 'ADMIN', versao: 0 });
      expect(t.role).toBe('USER');
    });
  });
});

executar('encomendas, contra a base de dados', () => {
  const TABELA = [{ ateGramas: 1000, precoCents: 450 }];

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(URI as string, { dbName: 'pds-testes' });
    }
  }, 30_000);

  beforeEach(async () => {
    await Promise.all([Order.deleteMany({}), Contador.deleteMany({}), MovimentoStock.deleteMany({})]);
  });

  afterAll(async () => {
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Order.deleteMany({}),
      Contador.deleteMany({}),
      MovimentoStock.deleteMany({}),
    ]);
  });

  const CLIENTE: DadosCliente = {
    customerName: 'Marta Ferreira',
    customerEmail: 'marta@exemplo.pt',
    customerPhone: '910000000',
    deliveryType: 'SHIPPING',
    shippingAddress: 'Rua de Exemplo, 1',
    shippingCity: 'Porto',
    shippingPostal: '4000-001',
  };

  /** O stock da primeira medida — a unica, numa peca unica. */
  const stock = async (id: unknown, i = 0) => (await Product.findById(id).lean())!.variantes[i].stock;

  async function peca({ stock: s = 3, ...over }: Record<string, unknown> & { stock?: number }) {
    const categoria =
      (await Category.findOne({ slug: 'quartzos' })) ??
      (await Category.create({ name: 'Quartzos', slug: 'quartzos' }));
    return Product.create({
      name: 'Quartzo rosa',
      slug: `quartzo-${new mongoose.Types.ObjectId()}`,
      priceCents: 1990,
      variantes: [{ stock: s }],
      weightGrams: 200,
      categoryId: categoria._id,
      ...over,
    });
  }

  const vid = (p: { variantes: { _id: unknown }[] }, i = 0) => String(p.variantes[i]._id);

  it('o preço sai da base de dados', async () => {
    const p = await peca({});
    const r = await calcularEncomenda([{ id: p._id.toString(), quantidade: 2 }], TABELA);
    expect(r).toMatchObject({ ok: true, subtotalCents: 3980, shippingCents: 450, totalCents: 4430 });
  });

  it('um produto desativado está indisponível, mesmo que exista', async () => {
    const p = await peca({ active: false });
    const r = await calcularEncomenda([{ id: p._id.toString(), quantidade: 1 }], TABELA);
    expect(r).toEqual({ ok: false, problemas: [{ tipo: 'indisponivel', id: p._id.toString() }] });
  });

  it('a última peça, pedida duas vezes ao mesmo tempo, vende-se uma vez', async () => {
    const p = await peca({ stock: 1 });
    const pedido = [{ id: p._id.toString(), quantidade: 1 }];

    const [a, b] = await Promise.all([
      criarEncomenda(pedido, CLIENTE, TABELA),
      criarEncomenda(pedido, CLIENTE, TABELA),
    ]);

    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    expect(await stock(p._id)).toBe(0);
    expect(await Order.countDocuments()).toBe(1);
  });

  it('se uma peça falhar, as outras voltam ao stock', async () => {
    const a = await peca({ stock: 5 });
    const b = await peca({ stock: 1 });

    const linhaB = { productId: b._id.toString(), varianteId: vid(b), name: 'b', priceCents: 1, quantity: 2 };
    const falhou = await reservarStock(
      [{ productId: a._id.toString(), varianteId: vid(a), name: 'a', priceCents: 1, quantity: 2 }, linhaB],
      new mongoose.Types.ObjectId().toString()
    );

    expect(falhou).toEqual(linhaB);
    expect(await stock(a._id)).toBe(5);
    expect(await stock(b._id)).toBe(1);
  });

  it('o stock de uma medida não se tira de outra (a armadilha do $elemMatch)', async () => {
    // Medida 14 esgotada, 16 com stock. Com duas condicoes soltas em vez do
    // $elemMatch, a consulta encontrava o produto (a 14 existe, a 16 tem
    // stock) e o $ posicional tirava da 14, que ficava em -1.
    const anel = await peca({ variantes: [{ medida: '14', stock: 0 }, { medida: '16', stock: 5 }] });

    const ok = await moverStock({
      productId: anel._id.toString(),
      varianteId: vid(anel, 0),
      delta: -1,
      motivo: 'venda-loja',
      por: 'admin:x',
    });

    expect(ok).toBe(false);
    expect(await stock(anel._id, 0)).toBe(0);
    expect(await stock(anel._id, 1)).toBe(5);
  });

  it('a venda ao balcão e a reserva online da última peça: só uma leva', async () => {
    const p = await peca({ stock: 1 });

    const [online, balcao] = await Promise.all([
      criarEncomenda([{ id: p._id.toString(), quantidade: 1 }], CLIENTE, TABELA),
      moverStock({ productId: p._id.toString(), varianteId: vid(p), delta: -1, motivo: 'venda-loja', por: 'admin:x' }),
    ]);

    expect([online.ok, balcao].filter(Boolean)).toHaveLength(1);
    expect(await stock(p._id)).toBe(0);
    expect(await MovimentoStock.countDocuments()).toBe(1);
  });

  it('uma peça única não passa de uma unidade, e cada movimento fica registado', async () => {
    const p = await peca({ stock: 1 });
    const entrada = { productId: p._id.toString(), varianteId: vid(p), motivo: 'entrada' as const, por: 'admin:x', maximo: 1 };

    expect(await moverStock({ ...entrada, delta: 1 })).toBe(false);
    expect(await moverStock({ ...entrada, delta: -1, motivo: 'venda-loja' })).toBe(true);
    expect(await moverStock({ ...entrada, delta: 1 })).toBe(true);

    expect(await stock(p._id)).toBe(1);
    // Por _id e nao por data: dois movimentos no mesmo milissegundo empatavam.
    const movimentos = await MovimentoStock.find().sort({ _id: 1 }).lean();
    expect(movimentos.map((m) => [m.motivo, m.delta])).toEqual([['venda-loja', -1], ['entrada', 1]]);
  });

  it('a encomenda nasce por pagar, numerada, com o stock reservado e o histórico', async () => {
    const p = await peca({ stock: 3 });
    const agora = new Date('2026-09-24T10:00:00Z');

    const r = await criarEncomenda([{ id: p._id.toString(), quantidade: 2 }], CLIENTE, TABELA, agora);

    expect(r).toMatchObject({ ok: true, numero: '2026-000001', totalCents: 3980 + 450 });
    const e = (await Order.findOne().lean())!;
    expect(e.status).toBe('PENDING');
    expect(e.reservaAte!.getTime()).toBe(agora.getTime() + PRAZO_RESERVA_MS);
    expect(e.historico).toEqual([{ para: 'PENDING', em: agora, por: 'cliente' }]);
    expect(await stock(p._id)).toBe(1);
    // A reserva e um movimento como os do balcao, com a encomenda.
    const m = (await MovimentoStock.findOne().lean())!;
    expect(m).toMatchObject({ motivo: 'reserva-online', delta: -2 });
    expect(String(m.encomendaId)).toBe(String(e._id));
    expect(e.items[0].varianteId).toBeDefined();
  });

  it('os números nunca se repetem, mesmo pedidos ao mesmo tempo', async () => {
    const numeros = await Promise.all(Array.from({ length: 10 }, () => proximoNumero()));
    expect(new Set(numeros).size).toBe(10);
  });

  it('uma reserva expirada liberta-se uma vez, mesmo com duas limpezas a correr', async () => {
    const p = await peca({ stock: 3 });
    const antes = new Date(Date.now() - 2 * PRAZO_RESERVA_MS);
    await criarEncomenda([{ id: p._id.toString(), quantidade: 2 }], CLIENTE, TABELA, antes);
    expect(await stock(p._id)).toBe(1);

    const [x, y] = await Promise.all([libertarReservasExpiradas(), libertarReservasExpiradas()]);

    expect(x + y).toBe(1);
    expect(await stock(p._id)).toBe(3);
    const e = (await Order.findOne().lean())!;
    expect(e.status).toBe('CANCELLED');
    expect(e.historico.at(-1)).toMatchObject({ de: 'PENDING', para: 'CANCELLED', por: 'sistema' });
    expect(await MovimentoStock.countDocuments({ motivo: 'reserva-libertada' })).toBe(1);
  });

  it('não se salta estados, e duas mudanças ao mesmo tempo não se atropelam', async () => {
    const p = await peca({ stock: 3 });
    const r = await criarEncomenda([{ id: p._id.toString(), quantidade: 1 }], CLIENTE, TABELA);
    if (!r.ok) throw new Error('a encomenda devia ter sido criada');

    expect(await mudarEstado(r.id, 'SHIPPED', 'admin:x')).toEqual({
      ok: false,
      motivo: 'transicao-proibida',
    });

    const [pago, cancelado] = await Promise.all([
      mudarEstado(r.id, 'PROCESSING', 'sistema'),
      mudarEstado(r.id, 'CANCELLED', 'cliente'),
    ]);
    expect([pago.ok, cancelado.ok].filter(Boolean)).toHaveLength(1);

    const e = (await Order.findById(r.id).lean())!;
    expect(e.historico).toHaveLength(2);
    // Se foi o cancelamento a ganhar, o stock voltou; se foi o pagamento, nao.
    expect(await stock(p._id)).toBe(e.status === 'CANCELLED' ? 3 : 2);
  });
});

describe('a própria suite de integração', () => {
  it('não passa despercebida quando devia ter corrido', () => {
    // Fora do bloco condicional de propósito: este corre sempre.
    if (!URI) {
      expect(ligou, 'sem MONGODB_URI, é suposto não ligar').toBe(false);
      return;
    }

    expect(
      ligou,
      'MONGODB_URI existe mas a suite não chegou a ligar-se: verde a mentir',
    ).toBe(true);
  });
});
