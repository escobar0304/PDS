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
