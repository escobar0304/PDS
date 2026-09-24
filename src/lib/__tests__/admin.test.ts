import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * As paginas privadas decidem quem entra no servidor, nunca no browser.
 *
 * Ate 24/09/2026 as tres de `/admin` abriam para qualquer pessoa, e a area
 * pessoal redirecionava no cliente, depois de carregar. Tudo o que corre no
 * browser pode ser mudado por quem o usa; a guarda tem de estar no servidor,
 * e em cada pagina — um `layout.tsx` nao chega (ver `paginaDeAdmin`).
 */

const APP = join(__dirname, '..', '..', 'app');

function paginas(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return paginas(caminho);
    return nome === 'page.tsx' ? [caminho] : [];
  });
}

const PRIVADAS = [
  { pasta: 'admin', guarda: /await paginaDeAdmin\(\)/ },
  { pasta: 'area-pessoal', guarda: /await paginaComSessao\(/ },
];

describe.each(PRIVADAS)('/$pasta', ({ pasta, guarda }) => {
  const raiz = join(APP, pasta);
  const ficheiros = paginas(raiz);

  it('encontra páginas para verificar', () => {
    expect(ficheiros.length).toBeGreaterThan(0);
  });

  it('todas chamam a guarda no servidor antes de renderizar', () => {
    const sem = ficheiros
      .filter((f) => !guarda.test(readFileSync(f, 'utf8')))
      .map((f) => relative(raiz, f));
    expect(sem, `páginas de /${pasta} sem guarda no servidor`).toEqual([]);
  });

  it('nenhuma é componente de cliente', () => {
    // Num componente de cliente a guarda nao corre no servidor.
    const cliente = ficheiros
      .filter((f) => /^['"]use client['"]/m.test(readFileSync(f, 'utf8')))
      .map((f) => relative(raiz, f));
    expect(cliente).toEqual([]);
  });
});

describe('promover a administrador', () => {
  it('nenhuma página nem rota o pode fazer: só o script, no servidor', () => {
    const todos = (dir: string): string[] =>
      readdirSync(dir).flatMap((nome) => {
        const c = join(dir, nome);
        return statSync(c).isDirectory() ? todos(c) : /\.(ts|tsx)$/.test(nome) ? [c] : [];
      });
    const culpados = todos(APP)
      .filter((f) => /\bmudarPapel\b/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(APP, f));
    expect(culpados, 'mudarPapel chamado a partir da web').toEqual([]);
  });
});
