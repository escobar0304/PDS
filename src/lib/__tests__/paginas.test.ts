import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LIVRO_RECLAMACOES,
  PAGINAS,
  paginasDisponiveis,
  paginasEmFalta,
  paginasObrigatoriasProntas,
} from '../paginas';

const APP = join(__dirname, '..', '..', 'app');

/**
 * `paginas.ts` so vale enquanto disser a verdade sobre o que esta no
 * repositorio. Uma pagina criada sem actualizar a lista fica invisivel no
 * rodape; uma apagada sem actualizar a lista devolve o 404 que isto veio
 * resolver.
 */
describe('páginas institucionais', () => {
  it('o que a lista diz que existe, existe mesmo', () => {
    const erradas = PAGINAS.filter(
      (p) => p.existe !== existsSync(join(APP, p.href.slice(1), 'page.tsx')),
    ).map((p) => `${p.href}: lista diz existe=${p.existe}`);

    expect(erradas, 'a lista e o disco discordam').toEqual([]);
  });

  it('o rodapé só mostra o que existe', () => {
    for (const p of paginasDisponiveis()) {
      expect(p.existe, `${p.href} no rodapé sem existir`).toBe(true);
    }
  });

  it('toda a página em falta diz porque falta', () => {
    for (const p of paginasEmFalta()) {
      expect(p.porQueFalta, `${p.href} sem razão`).toBeTruthy();
    }
  });

  it('a indexação só abre quando não faltar nenhuma obrigatória', () => {
    expect(paginasObrigatoriasProntas()).toBe(paginasEmFalta().length === 0);
  });

  it('o livro de reclamações aponta à plataforma oficial', () => {
    // DL 156/2005: a obrigacao e a ligacao, nao uma pagina propria.
    expect(LIVRO_RECLAMACOES.href).toBe('https://www.livroreclamacoes.pt');
  });

  it('não há páginas institucionais órfãs no disco', () => {
    // Uma pagina que exista mas nao conste da lista nunca aparece no rodape.
    const conhecidas = new Set(PAGINAS.map((p) => p.href.slice(1)));
    const ignorar = new Set([
      'admin', 'api', 'auth', 'area-pessoal', 'carrinho', 'catalogo',
      'loja', 'produto', 'sobre-nos',
    ]);

    const orfas = readdirSync(APP, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !ignorar.has(e.name) && !conhecidas.has(e.name))
      .filter((e) => existsSync(join(APP, e.name, 'page.tsx')))
      .map((e) => e.name);

    expect(orfas, 'páginas no disco que o rodapé nunca mostra').toEqual([]);
  });
});
