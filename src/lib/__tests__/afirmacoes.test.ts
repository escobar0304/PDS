import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AVISO_TRADICAO, RETIRADAS } from '../afirmacoes';

/**
 * As afirmacoes comerciais retiradas nao voltam sem alguem as sustentar.
 *
 * O sitio afirmava prazos de entrega, portes gratis, certificados, um servico
 * de avaliacao gemologica e uma decada de historia — escritos por um gerador,
 * nao pelo negocio. Uma afirmacao comercial falsa e pratica desleal (DL
 * 57/2008) com ou sem loja a funcionar. Este teste falha se alguma delas
 * reaparecer numa pagina, ou na base de dados pelo `seed`.
 */

const RAIZ = process.cwd();

function ficheiros(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return nome === '__tests__' ? [] : ficheiros(caminho);
    return nome.endsWith('.tsx') ? [caminho] : [];
  });
}

/** O texto que chega a quem visita: sem comentarios, que explicam o que saiu. */
function semComentarios(fonte: string): string {
  return fonte
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1');
}

const ALVOS = [...ficheiros(join(RAIZ, 'src')), join(RAIZ, 'scripts', 'seed.ts')];

describe('afirmações comerciais', () => {
  it.each(RETIRADAS.map((r) => [r.frase.source, r] as const))(
    'ninguém volta a escrever /%s/',
    (_nome, { frase, porque }) => {
      const onde = ALVOS.filter((f) => frase.test(semComentarios(readFileSync(f, 'utf-8')))).map(
        (f) => relative(RAIZ, f),
      );
      expect(onde, `${porque} — sai de RETIRADAS quando houver prova`).toEqual([]);
    },
  );

  it('onde há propriedades dos cristais, há o aviso de que não é medicina', () => {
    // Uma pagina que mostre as propriedades sem o aviso volta a pô-las no
    // terreno das alegacoes de saude.
    const produto = readFileSync(join(RAIZ, 'src', 'app', 'produto', '[slug]', 'page.tsx'), 'utf-8');
    expect(produto).toContain('properties.beneficios');
    expect(produto).toContain('{AVISO_TRADICAO}');
    expect(AVISO_TRADICAO).toMatch(/não substituem aconselhamento/i);
  });

  it('a guarda vê mesmo o texto das páginas', () => {
    // Sem isto, uma expressao regular partida passava tudo em silencio.
    expect(RETIRADAS.some((r) => r.frase.test('Envio Grátis em compras acima de 50€'))).toBe(true);
    expect(semComentarios('<p>visivel</p> {/* escondido */}')).not.toContain('escondido');
  });
});
