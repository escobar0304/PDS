import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { limpar, registarErro, resumirErro } from '../registo';

describe('o que fica nos registos do servidor', () => {
  it('um erro de índice único do Mongo não deixa o email', () => {
    const erro = Object.assign(
      new Error('E11000 duplicate key error collection: pds.users index: email_1 dup key: { email: "marta@exemplo.pt" }'),
      { name: 'MongoServerError', code: 11000 },
    );
    const r = resumirErro(erro);
    expect(r).not.toContain('marta@exemplo.pt');
    expect(r).toContain('MongoServerError [11000]');
    expect(r).toContain('[email]');
  });

  it('não deixa chaves, tokens nem credenciais de ligação', () => {
    const t = limpar(
      'sk_live_51Habc whsec_abc123 token=Qm9sYS1tdW5kby1lc3RlLWUtdW0tdG9rZW4tYmFzZTY0 mongodb://pds:segredo@db.exemplo.pt/pds',
    );
    expect(t).not.toMatch(/sk_live|whsec_abc|Qm9sYS1|segredo/);
    expect(t).toContain('mongodb://[credenciais]@db.exemplo.pt');
  });

  it('escreve o contexto e o tipo do erro, que é o que serve para o perceber', () => {
    const espiao = vi.spyOn(console, 'error').mockImplementation(() => {});
    registarErro('Erro ao registar utilizador:', new TypeError('x de undefined'));
    expect(espiao.mock.calls[0][0]).toMatch(/^Erro ao registar utilizador: TypeError: x de undefined/);
    espiao.mockRestore();
  });

  it('nenhum código do servidor passa um erro inteiro ao console', () => {
    // Nos componentes de cliente o console e o do browser de quem os usa;
    // no servidor, e o registo do alojamento.
    const SRC = join(__dirname, '..', '..');
    const todos = (d: string): string[] =>
      readdirSync(d).flatMap((n) => {
        const c = join(d, n);
        if (n === '__tests__') return [];
        return statSync(c).isDirectory() ? todos(c) : /\.(ts|tsx)$/.test(n) ? [c] : [];
      });
    const culpados = todos(SRC)
      .filter((f) => !f.endsWith('registo.ts'))
      .filter((f) => {
        const fonte = readFileSync(f, 'utf8');
        return !/^['"]use client['"]/m.test(fonte) && /console\.(error|warn|log|info)\(/.test(fonte);
      })
      .map((f) => relative(SRC, f));
    expect(culpados, 'use registarErro (src/lib/registo.ts)').toEqual([]);
  });
});
