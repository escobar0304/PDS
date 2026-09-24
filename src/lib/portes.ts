import { eCentimos } from '@/lib/dinheiro';
import type { Escalao } from '@/lib/condicoes';

/**
 * Portes por peso: logica pura, sem base de dados, para a pagina `/envios`
 * a poder usar e para se testar sem ligar nada.
 */

/** Uma tabela com que se pode fazer contas: escaloes crescentes, inteiros. */
export function tabelaValida(tabela: readonly Escalao[]): boolean {
  if (tabela.length === 0) return false;
  return tabela.every(
    (e, i) =>
      Number.isSafeInteger(e.ateGramas) &&
      e.ateGramas > 0 &&
      eCentimos(e.precoCents) &&
      (i === 0 || e.ateGramas > tabela[i - 1].ateGramas)
  );
}

/**
 * O preco do primeiro escalao que cobre o peso, ou `null` se o peso passar
 * o ultimo. Nesse caso nao se inventa um preco: a encomenda nao se pode
 * concluir pelo sitio, e quem decide e o negocio.
 */
export function portesPara(gramas: number, tabela: readonly Escalao[]): number | null {
  return tabela.find((e) => gramas <= e.ateGramas)?.precoCents ?? null;
}

const QUILOS = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 2 });

/** `250` → `250 g`; `1500` → `1,5 kg`. */
export function formatarPeso(gramas: number): string {
  return gramas < 1000 ? `${gramas} g` : `${QUILOS.format(gramas / 1000)} kg`;
}
