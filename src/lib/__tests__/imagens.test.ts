import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * O otimizador do Next so faz o que lhe dizem.
 *
 * Sem `sizes`, uma imagem com `fill` assume `100vw`: uma miniatura de 80 px
 * no carrinho passa a pedir uma imagem de 1920 px. E `quality` escrito a mao
 * na pagina rebenta as imagens quando nao coincide com a lista permitida no
 * `next.config.js` — foi assim que os dois heros deixaram de carregar durante
 * esta fase, e so se viu porque houve medicao depois da alteracao.
 */

const RAIZ = join(__dirname, '..', '..');

function tsx(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return tsx(caminho);
    return nome.endsWith('.tsx') ? [caminho] : [];
  });
}

const ficheiros = tsx(RAIZ).map((c) => ({ caminho: c.slice(RAIZ.length + 1), fonte: readFileSync(c, 'utf8') }));

describe('imagens', () => {
  it('toda a imagem com fill declara sizes', () => {
    const faltosas: string[] = [];

    for (const { caminho, fonte } of ficheiros) {
      for (const m of fonte.matchAll(/<Image\b([\s\S]*?)\/>/g)) {
        const props = m[1];
        if (/(^|\s)fill(\s|$|\n)/.test(props) && !props.includes('sizes=')) {
          faltosas.push(`${caminho}:${fonte.slice(0, m.index).split('\n').length}`);
        }
      }
    }

    expect(faltosas, 'sem sizes, o Next assume 100vw e pede a imagem maior').toEqual([]);
  });

  it('a qualidade decide-se no next.config.js e não em cada página', () => {
    const comQuality = ficheiros
      .filter(({ fonte }) => /quality=\{/.test(fonte))
      .map(({ caminho }) => caminho);

    expect(
      comQuality,
      'quality escrito à mão rebenta a imagem se não constar de images.qualities',
    ).toEqual([]);
  });

  it('a qualidade configurada está no intervalo que foi medido', () => {
    const config = readFileSync(join(RAIZ, '..', 'next.config.js'), 'utf8');
    const m = config.match(/qualities:\s*\[(\d+)\]/);

    expect(m, 'images.qualities deixou de estar definido').not.toBeNull();

    // Acima de 85 desperdica bytes sem diferenca visivel; abaixo de 78 comeca
    // a perder textura mineral, que numa loja de pedras e o produto.
    const q = Number(m![1]);
    expect(q).toBeGreaterThanOrEqual(78);
    expect(q).toBeLessThanOrEqual(85);
  });
});
