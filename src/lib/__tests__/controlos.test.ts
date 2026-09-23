import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { esquemaPerfil } from '../validacao';

/**
 * Um controlo que nao faz nada.
 *
 * A pagina de produto tinha um botao "Partilhar" sem `onClick`, e um coracao
 * que mudava de cor sem guardar nada. E a mesma falha do rodape que ligava
 * para paginas inexistentes, e do botao da Google sem credenciais: oferecer um
 * caminho que nao leva a lado nenhum. Esta guarda apanha o caso mais simples
 * — o botao sem accao nenhuma — em todo o codigo.
 */

const SRC = join(process.cwd(), 'src');

function ficheiros(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return nome === '__tests__' ? [] : ficheiros(caminho);
    return nome.endsWith('.tsx') ? [caminho] : [];
  });
}

describe('os botões fazem alguma coisa', () => {
  it('nenhum <button> sem onClick, sem type="submit" e sem props passadas', () => {
    const mortos: string[] = [];
    for (const f of ficheiros(SRC)) {
      // O componente Button e onde o <button> e definido, com as props a passar.
      if (f.endsWith(join('ui', 'Button.tsx'))) continue;
      const fonte = readFileSync(f, 'utf-8');
      for (const m of fonte.matchAll(/<(button|Button)\b([^>]*?)>/g)) {
        const atributos = m[2];
        if (/onClick|type="submit"|\{\.\.\./.test(atributos)) continue;
        const linha = fonte.slice(0, m.index).split('\n').length;
        mortos.push(`${relative(process.cwd(), f)}:${linha}`);
      }
    }
    expect(mortos, 'botões sem acção nenhuma').toEqual([]);
  });
});

describe('mudar o nome aceita o nome, e só o nome', () => {
  it('aceita um nome', () => {
    expect(esquemaPerfil.safeParse({ name: '  Marta Ferreira ' })).toEqual({
      success: true,
      data: { name: 'Marta Ferreira' },
    });
  });

  it('recusa campos que não pediu, em vez de os ignorar', () => {
    // Uma rota de perfil que escreva o corpo inteiro e o caminho classico
    // para alguem se promover a ADMIN.
    for (const extra of [{ role: 'ADMIN' }, { email: 'outro@exemplo.pt' }, { emailVerified: true }]) {
      expect(esquemaPerfil.safeParse({ name: 'Marta', ...extra }).success, JSON.stringify(extra)).toBe(
        false,
      );
    }
  });

  it('recusa um nome vazio e um que não seja texto', () => {
    expect(esquemaPerfil.safeParse({ name: '   ' }).success).toBe(false);
    expect(esquemaPerfil.safeParse({ name: { $ne: null } }).success).toBe(false);
    expect(esquemaPerfil.safeParse({ name: 'x'.repeat(121) }).success).toBe(false);
  });

  it('a rota escreve só o nome, na conta da sessão', () => {
    const rota = readFileSync(join(SRC, 'app', 'api', 'conta', 'route.ts'), 'utf-8');
    const patch = rota.slice(rota.indexOf('export async function PATCH'));
    expect(patch).toContain('esquemaPerfil');
    expect(patch).toContain('{ _id: permissao.sessao.id }');
    expect(patch).toContain('{ $set: { name: corpo.dados.name } }');
  });
});

describe('as ligações internas levam a páginas que existem', () => {
  /** As rotas que o App Router serve: pastas com `page.tsx` ou `route.ts`. */
  function rotas(): RegExp[] {
    const encontradas: string[] = [];
    const andar = (dir: string, caminho: string) => {
      for (const nome of readdirSync(dir)) {
        const c = join(dir, nome);
        if (statSync(c).isDirectory()) andar(c, `${caminho}/${nome}`);
        else if (nome === 'page.tsx' || nome === 'route.ts') encontradas.push(caminho);
      }
    };
    andar(join(SRC, 'app'), '');
    return encontradas.map((r) => new RegExp(`^${r.replace(/\[[^\]]+\]/g, '[^/]+')}$`));
  }

  it('nenhum href para uma rota sem página', () => {
    // "Finalizar Compra" levava a /checkout desde o inicio do projeto, e o
    // rodape chegou a ligar para quatro paginas que nao existiam. O mesmo
    // erro, duas vezes: oferecer um caminho que nao leva a lado nenhum.
    const existentes = rotas();
    const partidas: string[] = [];
    for (const f of ficheiros(SRC)) {
      const fonte = readFileSync(f, 'utf-8');
      const hrefs = [
        ...[...fonte.matchAll(/href="(\/[^"]*)"/g)].map((m) => ({ h: m[1], dinamica: false })),
        // `/produto/${slug}`: so se conhece o prefixo, e falta um segmento.
        ...[...fonte.matchAll(/href=\{`(\/[^`$]*)(\$?)/g)].map((m) => ({
          h: m[1],
          // So e segmento se o `${` vier logo a seguir a uma barra; em
          // `/loja?categoria=${x}` o valor esta na query, nao no caminho.
          dinamica: m[2] === '$' && m[1].endsWith('/'),
        })),
      ];
      for (const { h, dinamica } of hrefs) {
        const caminho = h.split(/[?#]/)[0].replace(/(.)\/$/, '$1');
        // A raiz e ''; um prefixo dinamico ganha um segmento qualquer.
        const alvo = caminho === '/' ? '' : dinamica ? `${caminho.replace(/\/$/, '')}/x` : caminho;
        if (!existentes.some((r) => r.test(alvo))) {
          partidas.push(`${relative(process.cwd(), f)}: ${h}`);
        }
      }
    }
    expect(partidas, 'ligações para rotas que não existem').toEqual([]);
  });
});
