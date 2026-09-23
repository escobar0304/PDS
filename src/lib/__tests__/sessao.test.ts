import { describe, expect, it, vi } from 'vitest';

/**
 * O que acontece a uma sessao quando nao se consegue perguntar a base de
 * dados. Os casos com base de dados estao em `integracao.test.ts`.
 */

// A base de dados em baixo: toda a ligacao falha.
vi.mock('../db', () => ({
  default: () => Promise.reject(new Error('sem base de dados')),
}));

const ID = '64b7f0c2a1b2c3d4e5f60718';

describe('sessões com a base de dados em baixo', () => {
  it('não se sabe, e isso não é o mesmo que revogada', async () => {
    const { verificarSessao } = await import('../sessao');
    expect(await verificarSessao(ID, 0)).toEqual({ estado: 'desconhecido' });
  });

  it('a sessão continua: expulsar toda a gente não protege nada', async () => {
    const { authOptions } = await import('../auth');
    const token = { userId: ID, role: 'USER', versao: 0 };
    await expect(authOptions.callbacks!.jwt!({ token } as never)).resolves.toMatchObject({
      userId: ID,
    });
  });

  it('e mudar o nome também não a termina', async () => {
    const { authOptions } = await import('../auth');
    const token = { userId: ID, role: 'USER', versao: 0, name: 'Marta' };
    await expect(
      authOptions.callbacks!.jwt!({ token, trigger: 'update' } as never),
    ).resolves.toMatchObject({ name: 'Marta' });
  });
});

describe('um identificador que não é da base de dados', () => {
  it('revoga, sem chegar a perguntar', async () => {
    const { verificarSessao } = await import('../sessao');
    expect(await verificarSessao(undefined, 0)).toEqual({ estado: 'revogada' });
    // Um id da Google num token antigo, por exemplo.
    expect(await verificarSessao('109876543210987654321', 0)).toEqual({ estado: 'revogada' });
  });
});
