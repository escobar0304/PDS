import { hash, verify } from 'argon2';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Order, Token, User } from '../models';
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
      expect(await verify(lido!.password, 'aPasswordCerta')).toBe(true);
      expect(await verify(lido!.password, 'aPasswordErrada')).toBe(false);
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

      await Order.create({ userId: eu._id, status: 'PENDING', total: 10 });
      await Order.create({ userId: outro._id, status: 'PENDING', total: 99 });

      const dados = await exportarDados(eu._id.toString());

      expect(dados!.encomendas).toHaveLength(1);
      expect(JSON.stringify(dados!.encomendas)).not.toContain('99');
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
      const encomenda = await Order.create({ userId: u._id, status: 'PAID', total: 42 });

      await apagarConta(u._id.toString());

      const depois = await Order.findById(encomenda._id);
      // A conservacao fiscal dos documentos de venda sobrepoe-se ao direito ao
      // apagamento (art. 17.º, n.º 3, alinea b). A encomenda fica, sem dono.
      expect(depois).not.toBeNull();
      expect(depois!.total).toBe(42);
      expect(depois!.userId).toBeUndefined();
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
      expect(await verify(depois!.password, 'aNova')).toBe(true);
      expect(await verify(depois!.password, 'aVelha')).toBe(false);
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
