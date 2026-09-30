import { describe, expect, it } from 'vitest';
import { esquemaContacto, esquemaCredenciais, esquemaMaioridade, esquemaPerfil, esquemaRegisto, lerCorpo } from '../validacao';

/**
 * A injeccao NoSQL nao e teorica: `{"email": {"$ne": null}}` num corpo JSON
 * passava em `if (!email)` e transformava `findOne({ email })` em "devolve-me
 * um utilizador qualquer". Estes testes sao o que impede isso de voltar.
 */

const OPERADORES = [
  { $ne: null },
  { $gt: '' },
  { $regex: '.*' },
  { $where: '1==1' },
  { $exists: true },
];

describe('validação do corpo dos pedidos', () => {
  it('recusa operadores do Mongo onde espera texto', () => {
    for (const payload of OPERADORES) {
      expect(
        esquemaCredenciais.safeParse({ email: payload, password: 'x' }).success,
        `credenciais aceitaram ${JSON.stringify(payload)}`,
      ).toBe(false);

      expect(
        esquemaRegisto.safeParse({ name: 'A', email: payload, password: 'abcdef' }).success,
        `registo aceitou ${JSON.stringify(payload)}`,
      ).toBe(false);
    }
  });

  it('recusa arrays, números e nulos onde espera texto', () => {
    for (const valor of [['a@b.pt'], 42, null, true, undefined]) {
      expect(esquemaCredenciais.safeParse({ email: valor, password: 'x' }).success).toBe(false);
    }
  });

  it('aceita o caso normal', () => {
    const r = esquemaRegisto.safeParse({
      name: '  Marta Ferreira ',
      email: '  Marta@Exemplo.PT ',
      password: 'umapassword',
      maiorDeIdade: true,
    });

    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe('Marta Ferreira');
      // Normalizado: evita duas contas para o mesmo endereço.
      expect(r.data.email).toBe('marta@exemplo.pt');
    }
  });

  it('só cria conta quem declara ter 18 anos, e só com `true`', () => {
    const base = { name: 'Marta', email: 'marta@exemplo.pt', password: 'umapassword' };
    expect(esquemaRegisto.safeParse({ ...base, maiorDeIdade: true }).success).toBe(true);
    for (const valor of [undefined, false, 'true', 1, 'sim', { $ne: false }, [true], null]) {
      expect(
        esquemaRegisto.safeParse({ ...base, maiorDeIdade: valor }).success,
        `aceitou maiorDeIdade=${JSON.stringify(valor)}`,
      ).toBe(false);
    }
  });

  it('a declaração a posteriori só aceita a declaração', () => {
    expect(esquemaMaioridade.safeParse({ maiorDeIdade: true }).success).toBe(true);
    expect(esquemaMaioridade.safeParse({ maiorDeIdade: false }).success).toBe(false);
    // `strict()`: nada de trazer mais campos para a conta à boleia.
    expect(esquemaMaioridade.safeParse({ maiorDeIdade: true, role: 'ADMIN' }).success).toBe(false);
  });

  it('a palavra-passe nova tem pelo menos 8 caracteres', () => {
    const base = { name: 'Marta', email: 'marta@exemplo.pt', maiorDeIdade: true };
    expect(esquemaRegisto.safeParse({ ...base, password: '1234567' }).success).toBe(false);
    expect(esquemaRegisto.safeParse({ ...base, password: '12345678' }).success).toBe(true);
  });

  it('impõe limites de tamanho, para o corpo não ser um canal de abuso', () => {
    const enorme = 'a'.repeat(10_000);
    expect(esquemaContacto.safeParse({
      name: 'A', email: 'a@b.pt', subject: 'outro', message: enorme,
    }).success).toBe(false);

    expect(esquemaRegisto.safeParse({
      name: enorme, email: 'a@b.pt', password: 'abcdef',
    }).success).toBe(false);
  });

  it('o telefone é opcional mas não pode ser um objeto', () => {
    expect(esquemaContacto.safeParse({
      name: 'A', email: 'a@b.pt', subject: 'outro', message: 'olá',
    }).success).toBe(true);

    expect(esquemaContacto.safeParse({
      name: 'A', email: 'a@b.pt', phone: { $ne: null }, subject: 'outro', message: 'olá',
    }).success).toBe(false);
  });

  it('o telefone só tem algarismos e os sinais de um número', () => {
    const base = { name: 'A', email: 'a@b.pt', subject: 'outro', message: 'olá' };
    for (const phone of ['+351 912 345 678', '912345678', '(22) 123-4567', '']) {
      expect(esquemaContacto.safeParse({ ...base, phone }).success, phone).toBe(true);
    }
    for (const phone of ['liga-me', '12', '+351 912\r\nBcc: x@y.pt', '<script>', '9'.repeat(30)]) {
      expect(esquemaContacto.safeParse({ ...base, phone }).success, phone).toBe(false);
    }
  });

  it('o assunto é um dos do formulário, e nenhum outro', () => {
    const base = { name: 'A', email: 'a@b.pt', message: 'olá' };
    for (const subject of ['informacao', 'encomenda', 'personalizado', 'outro']) {
      expect(esquemaContacto.safeParse({ ...base, subject }).success).toBe(true);
    }
    for (const subject of ['x', 'Outro', 'outro\r\nBcc: x@y.pt', '', { $ne: null }, 'constructor']) {
      expect(esquemaContacto.safeParse({ ...base, subject }).success, JSON.stringify(subject)).toBe(false);
    }
  });
});

describe('lerCorpo', () => {
  const pedido = (tipo: string | null, corpo: string) =>
    new Request('http://x/api', {
      method: 'POST',
      headers: tipo ? { 'Content-Type': tipo } : {},
      body: corpo,
    });

  it('lê JSON declarado como JSON', async () => {
    const r = await lerCorpo(pedido('application/json; charset=utf-8', '{"name":"Ana"}'), esquemaPerfil);
    expect(r.ok).toBe(true);
  });

  it('recusa o mesmo corpo sem o tipo, que é o que um formulário de outro sítio envia', async () => {
    // `<form enctype="text/plain">` com um campo `{"name":"Ana","x":"` e o
    // valor `"}` produz exatamente este corpo.
    for (const tipo of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data', null]) {
      const r = await lerCorpo(pedido(tipo, '{"name":"Ana"}'), esquemaPerfil);
      expect(r.ok, String(tipo)).toBe(false);
    }
  });
});
