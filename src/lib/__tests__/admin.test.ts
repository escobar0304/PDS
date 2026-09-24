import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Nenhuma pagina de `/admin` abre sem a guarda.
 *
 * Ate 24/09/2026 as tres abriam para qualquer pessoa. Nao expunham nada,
 * porque nao faziam nada — mas a guarda tem de estar la antes da primeira
 * linha que leia dados, nao depois. E tem de estar em cada pagina: um
 * `layout.tsx` nao chega (ver `paginaDeAdmin`).
 */

const RAIZ = join(__dirname, '..', '..', 'app', 'admin');

function paginas(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return paginas(caminho);
    return nome === 'page.tsx' ? [caminho] : [];
  });
}

describe('/admin', () => {
  const ficheiros = paginas(RAIZ);

  it('encontra páginas para verificar', () => {
    expect(ficheiros.length).toBeGreaterThan(0);
  });

  it('todas chamam a guarda antes de renderizar', () => {
    const sem = ficheiros
      .filter((f) => !/await paginaDeAdmin\(\)/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(RAIZ, f));
    expect(sem, 'páginas de /admin sem paginaDeAdmin()').toEqual([]);
  });

  it('nenhuma é componente de cliente', () => {
    // Num componente de cliente a guarda nao corre no servidor.
    const cliente = ficheiros
      .filter((f) => /^['"]use client['"]/m.test(readFileSync(f, 'utf8')))
      .map((f) => relative(RAIZ, f));
    expect(cliente).toEqual([]);
  });
});
