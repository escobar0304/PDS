import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Classes partidas em varias strings (`'a b ' + 'c d'`) precisam de um espaco
 * na juncao, senao `text-ink` e `focus:ring-2` passam a `text-inkfocus:ring-2`:
 * duas classes que deixam de existir, sem erro nenhum. Aconteceu numa
 * migracao do Tailwind, e as capturas de ecra so apanharam uma das cinco,
 * porque as outras nao mudavam nada visivel.
 */

const RAIZ = join(process.cwd(), 'src');

function ficheiros(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return nome === '__tests__' ? [] : ficheiros(caminho);
    return /\.tsx?$/.test(nome) ? [caminho] : [];
  });
}

describe('classes em várias strings', () => {
  it('têm sempre um espaço na junção', () => {
    const coladas: string[] = [];
    for (const f of ficheiros(RAIZ)) {
      const fonte = readFileSync(f, 'utf8');
      // 'fim-de-classe' +  (quebra)  'inicio-de-classe'
      for (const m of fonte.matchAll(/'([^'\n]*[^\s'])'\s*\+\s*\n\s*'([^\s'][^'\n]*)'/g)) {
        const pareceClasses = /^[a-z0-9:[\]/.%-]+(?: [a-z0-9:[\]/.%()-]+)*$/i;
        if (pareceClasses.test(m[1]) && pareceClasses.test(m[2].trim())) {
          coladas.push(`${relative(process.cwd(), f)}:${fonte.slice(0, m.index).split('\n').length}`);
        }
      }
    }
    expect(coladas, 'falta um espaço no fim da primeira string, ou no início da segunda').toEqual([]);
  });
});
