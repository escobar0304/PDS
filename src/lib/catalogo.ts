/**
 * As regras do catalogo que dependem da categoria (ROADMAP-V2, C2).
 *
 * Logica pura: o painel de administracao chama isto antes de gravar, e os
 * testes chamam-no sem base de dados. O esquema do Mongoose nao ve a
 * categoria de um produto, por isso a regra "peca unica tem uma medida e
 * stock 0 ou 1" nao pode viver la.
 */

export interface VarianteDados {
  medida?: string;
  stock: number;
}

export type ProblemaCatalogo =
  | 'sem-medidas'
  | 'peca-unica-com-medidas'
  | 'peca-unica-com-stock-a-mais'
  | 'medida-sem-nome'
  | 'medida-repetida';

/**
 * O que impede estas medidas de ficarem num produto desta categoria. Vazio
 * quer dizer que pode gravar.
 */
export function problemasDasMedidas(
  variantes: readonly VarianteDados[],
  pecasUnicas: boolean
): ProblemaCatalogo[] {
  if (variantes.length === 0) return ['sem-medidas'];

  if (pecasUnicas) {
    const problemas: ProblemaCatalogo[] = [];
    if (variantes.length > 1 || variantes[0].medida) problemas.push('peca-unica-com-medidas');
    if (variantes.some((v) => v.stock > 1)) problemas.push('peca-unica-com-stock-a-mais');
    return problemas;
  }

  // Num modelo com medidas, cada uma tem nome — senao a pessoa nao sabe o
  // que escolhe — e nenhuma se repete, sem distinguir maiusculas.
  const problemas: ProblemaCatalogo[] = [];
  const nomes = variantes.map((v) => v.medida?.trim().toLowerCase() ?? '');
  if (nomes.some((n) => n === '')) problemas.push('medida-sem-nome');
  if (new Set(nomes).size !== nomes.length) problemas.push('medida-repetida');
  return problemas;
}

/** Se a pessoa tem de escolher uma medida antes de pôr no carrinho. */
export function temDeEscolher(variantes: readonly { medida?: string }[]): boolean {
  return variantes.length > 1 || Boolean(variantes[0]?.medida);
}

export function stockTotal(variantes: readonly { stock: number }[]): number {
  return variantes.reduce((s, v) => s + v.stock, 0);
}

/**
 * O produto como a loja o recebe: as medidas, e o stock total ja somado para
 * as listagens ("esgotado", "apenas 2"). O stock de cada medida vai tambem,
 * porque a pagina de produto precisa dele para a escolha.
 */
export function paraPublico<T extends { variantes: readonly { stock: number }[] }>(
  produto: T
): T & { stock: number } {
  return { ...produto, stock: stockTotal(produto.variantes) };
}
