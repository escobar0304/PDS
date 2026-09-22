import { describe, expect, it } from 'vitest';
import { esquemaContacto, esquemaCredenciais, esquemaRegisto } from '../validacao';

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
    });

    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe('Marta Ferreira');
      // Normalizado: evita duas contas para o mesmo endereço.
      expect(r.data.email).toBe('marta@exemplo.pt');
    }
  });

  it('impõe limites de tamanho, para o corpo não ser um canal de abuso', () => {
    const enorme = 'a'.repeat(10_000);
    expect(esquemaContacto.safeParse({
      name: 'A', email: 'a@b.pt', subject: 'x', message: enorme,
    }).success).toBe(false);

    expect(esquemaRegisto.safeParse({
      name: enorme, email: 'a@b.pt', password: 'abcdef',
    }).success).toBe(false);
  });

  it('o telefone é opcional mas não pode ser um objeto', () => {
    expect(esquemaContacto.safeParse({
      name: 'A', email: 'a@b.pt', subject: 'x', message: 'olá',
    }).success).toBe(true);

    expect(esquemaContacto.safeParse({
      name: 'A', email: 'a@b.pt', phone: { $ne: null }, subject: 'x', message: 'olá',
    }).success).toBe(false);
  });
});
