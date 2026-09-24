import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A CSP do sitio ainda tem `'unsafe-inline'` em `script-src`, e a decisao de
 * o manter fora da rota do pagamento assenta numa medicao: nao ha no codigo
 * nenhum sitio que transforme texto em HTML ou em codigo (ver
 * `docs/ROADMAP-V2.md`, fase 6). Este teste mantem essa condicao verdadeira.
 * Se falhar, ou o codigo novo encontra outra maneira, ou a decisao sobre a CSP
 * tem de ser revista — nunca as duas coisas em silencio.
 */

const SRC = join(__dirname, '..', '..');

function ficheiros(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return nome === '__tests__' ? [] : ficheiros(caminho);
    return /\.(ts|tsx)$/.test(nome) ? [caminho] : [];
  });
}

const PROIBIDOS: { padrao: RegExp; porque: string }[] = [
  { padrao: /dangerouslySetInnerHTML/, porque: 'HTML cru no React' },
  { padrao: /\.(inner|outer)HTML\s*=/, porque: 'HTML cru no DOM' },
  { padrao: /insertAdjacentHTML|document\.write/, porque: 'HTML cru no DOM' },
  { padrao: /\beval\s*\(|new Function\s*\(/, porque: 'texto executado como código' },
];

describe('nada transforma texto em HTML ou em código', () => {
  const todos = ficheiros(SRC);

  it('encontra ficheiros para verificar', () => {
    expect(todos.length).toBeGreaterThan(20);
  });

  for (const { padrao, porque } of PROIBIDOS) {
    it(porque + ` (${padrao.source})`, () => {
      const onde = todos
        .filter((f) => padrao.test(readFileSync(f, 'utf8')))
        .map((f) => relative(SRC, f));
      expect(onde).toEqual([]);
    });
  }
});
