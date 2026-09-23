import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Um esqueleto sozinho deixa a pagina muda.
 *
 * `Skeleton` e `SkeletonCartao` sao `aria-hidden` de proposito: uma grelha de
 * rectangulos cinzentos nao tem nada para dizer. Mas o que estava era pior do
 * que nada dito — era nada **anunciado**. A `/loja`, o `/catalogo` e o
 * `/produto` trocavam os esqueletos pelo conteudo sem qualquer sinal para
 * quem nao os ve: nem que estava a carregar, nem que tinha acabado.
 *
 * Isso e o criterio **4.1.3 Status Messages da WCAG 2.1, nivel AA** — o
 * mesmo nivel que este projeto diz cumprir em `CLAUDE.md`.
 *
 * O `axe` nao apanha o 4.1.3, e nao e falha dele: decidir que um texto e uma
 * mensagem de estado exige perceber a intencao da pagina, e nenhuma
 * ferramenta automatica sabe isso. A suite de `axe` estava verde num
 * criterio que nao cumpriamos. Por isso o guarda vive aqui.
 */

const APP = join(process.cwd(), 'src', 'app');

function paginas(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return paginas(caminho);
    return nome.endsWith('.tsx') ? [caminho] : [];
  });
}

/** Anuncia o estado de alguma forma que um leitor de ecra note. */
function anuncia(fonte: string): boolean {
  return (
    fonte.includes('role="status"') ||
    fonte.includes('<AnuncioEstado') ||
    fonte.includes('<Spinner')
  );
}

describe('estados de carregamento', () => {
  const comEsqueleto = paginas(APP).filter((f) => {
    const fonte = readFileSync(f, 'utf-8');
    return /<Skeleton(Cartao)?[\s/>]/.test(fonte);
  });

  it('há páginas com esqueletos para verificar', () => {
    // Se isto chegar a zero, o teste a seguir passa sem verificar nada.
    expect(comEsqueleto.length).toBeGreaterThan(0);
  });

  it.each(comEsqueleto.map((f) => [f.replace(process.cwd() + '/', ''), f]))(
    '%s anuncia o carregamento a quem não vê o esqueleto',
    (_rotulo, caminho) => {
      expect(
        anuncia(readFileSync(caminho as string, 'utf-8')),
        'usa esqueletos `aria-hidden` sem region de estado: WCAG 2.1 AA 4.1.3',
      ).toBe(true);
    },
  );
});

describe('a primitiva de anúncio', () => {
  const fonte = readFileSync(
    join(process.cwd(), 'src', 'components', 'ui', 'Feedback.tsx'),
    'utf-8',
  );

  it('o esqueleto continua escondido do leitor de ecrã', () => {
    // Se deixasse de o ser, o leitor de ecra passava a encontrar uma
    // sequencia de caixas vazias — pior do que o silencio que tinhamos.
    expect(fonte).toMatch(/export function Skeleton[\s\S]*?aria-hidden/);
  });

  it('o Spinner não anuncia o mesmo texto duas vezes', () => {
    // Tinha `aria-label={label}` **e** um `<span className="sr-only">` com o
    // mesmo texto: o nome da regiao e o conteudo dela. Alguns leitores liam
    // "A carregar, A carregar".
    const spinner = fonte.slice(fonte.indexOf('export function Spinner'));
    const corpo = spinner.slice(0, spinner.indexOf('export function Skeleton'));
    expect(corpo).not.toContain('aria-label={label}');
    expect(corpo).toContain('sr-only');
  });
});
