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

/**
 * `"19,90"` → `1990`, como uma pessoa escreve um preco num formulario: com
 * virgula ou ponto, com ou sem euro, ate duas casas. Sem virgula flutuante
 * pelo meio — `"0,29"` da 29 e nao 28,999. Devolve `null` a tudo o resto.
 */
export function centimosDeTexto(texto: string): number | null {
  const limpo = texto.replace(/€/g, '').replace(/\s/g, '');
  const m = /^(\d{1,7})(?:[.,](\d{1,2}))?$/.exec(limpo);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
}

/** `1990` → `"19,90"`, para pôr no campo de um formulario. */
export function textoDeCentimos(centimos: number): string {
  return `${Math.floor(centimos / 100)},${String(centimos % 100).padStart(2, '0')}`;
}
