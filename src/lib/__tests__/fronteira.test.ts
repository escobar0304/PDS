import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * O que corre no browser nunca chega aos segredos.
 *
 * Um componente de cliente vai inteiro para o browser, com tudo o que
 * importa, e o que importa esses tambem. Se um deles chegar a `lib/db.ts` ou
 * ao `services/mailer.ts`, o codigo que le `MONGODB_URI` ou `SMTP_PASS` fica
 * no bundle — e o Next so substitui por `undefined` o que nao comeca por
 * `NEXT_PUBLIC_`, o que salva o valor mas nao o desenho. Este teste segue os
 * `import` de cada componente de cliente ate ao fim e falha se algum chegar a
 * codigo do servidor, ou a uma variavel de ambiente que nao seja publica.
 */

const SRC = resolve(__dirname, '..', '..');

const DO_SERVIDOR = [
  'lib/db.ts',
  'lib/models.ts',
  'lib/auth.ts',
  'lib/pagamento.ts',
  'lib/avisos.ts',
  'lib/sessao.ts',
  'lib/autorizacao.ts',
  'lib/gestao.ts',
  'lib/gestao-encomendas.ts',
  'lib/encomenda.ts',
  'services/mailer.ts',
];

function ficheiros(d: string): string[] {
  return readdirSync(d).flatMap((n) => {
    const c = join(d, n);
    if (n === '__tests__') return [];
    return statSync(c).isDirectory() ? ficheiros(c) : /\.(ts|tsx)$/.test(n) ? [c] : [];
  });
}

function resolver(de: string, pedido: string): string | null {
  const base = pedido.startsWith('@/') ? join(SRC, pedido.slice(2)) : pedido.startsWith('.') ? resolve(dirname(de), pedido) : null;
  if (!base) return null;
  for (const c of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

function importados(f: string): string[] {
  const fonte = readFileSync(f, 'utf8');
  // So os `import` que chegam ao bundle: `import type` apaga-se na compilacao.
  return [...fonte.matchAll(/^import\s+(?!type\b)[^;]*?from\s+['"]([^'"]+)['"]/gm)]
    .map((m) => resolver(f, m[1]))
    .filter((x): x is string => x !== null);
}

const clientes = ficheiros(SRC).filter((f) => /^['"]use client['"]/m.test(readFileSync(f, 'utf8')));

describe('a fronteira entre o browser e o servidor', () => {
  it('encontra componentes de cliente para seguir', () => {
    expect(clientes.length).toBeGreaterThan(10);
  });

  it('nenhum componente de cliente chega a código do servidor', () => {
    const culpados: string[] = [];
    for (const inicio of clientes) {
      const vistos = new Set<string>();
      const fila = [inicio];
      while (fila.length) {
        const f = fila.pop()!;
        if (vistos.has(f)) continue;
        vistos.add(f);
        const r = relative(SRC, f);
        if (DO_SERVIDOR.includes(r)) {
          culpados.push(`${relative(SRC, inicio)} → ${r}`);
          continue;
        }
        const env = [...readFileSync(f, 'utf8').matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g)]
          .map((m) => m[1])
          .filter((v) => !v.startsWith('NEXT_PUBLIC_') && v !== 'NODE_ENV');
        if (env.length) culpados.push(`${relative(SRC, inicio)} → ${r} lê ${[...new Set(env)].join(', ')}`);
        fila.push(...importados(f));
      }
    }
    expect([...new Set(culpados)]).toEqual([]);
  });
});
