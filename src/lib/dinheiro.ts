/**
 * Dinheiro, em centimos inteiros.
 *
 * Ate 24/09/2026 os precos eram euros em virgula flutuante: `19.9 * 3` da
 * `59.699999999999996`, e o erro soma-se a cada linha, a cada portes, a cada
 * desconto. Qualquer fornecedor de pagamento pede inteiros em centimos. A
 * mudanca foi feita com a base de dados vazia de produtos, quando custava uma
 * renomeacao e nao uma migracao com dinheiro real no meio.
 *
 * Os campos chamam-se `...Cents` de proposito, e nao `price` com outro
 * significado: um sitio que ficasse por mudar mostrava 1990 € em vez de
 * 19,90 €. Com o nome novo, o que fica por mudar nao compila.
 */

/** Um valor em centimos: inteiro, nao negativo. */
export function eCentimos(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isSafeInteger(valor) && valor >= 0;
}

const EUROS = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

/** `1990` → `19,90 €`, como se escreve em Portugal. */
export function formatarPreco(centimos: number): string {
  return EUROS.format(centimos / 100);
}
