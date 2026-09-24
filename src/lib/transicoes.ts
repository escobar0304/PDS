/**
 * Os estados de uma encomenda, e por onde se pode passar (ROADMAP-V2, E3).
 *
 * Logica pura: quem muda o estado e `lib/encomenda.ts`, e so muda o que esta
 * tabela permite. Nao se expede uma encomenda por pagar, nao se reabre uma
 * cancelada, e uma concluida nao volta atras — a desistencia, quando existir
 * (P4), e um estado novo e nao um recuo.
 */

export const ESTADOS = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'READY_PICKUP',
  'COMPLETED',
  'CANCELLED',
] as const;

export type Estado = (typeof ESTADOS)[number];

/** Para onde se pode ir a partir de cada estado. */
export const TRANSICOES: Record<Estado, readonly Estado[]> = {
  // A espera do pagamento, com o stock reservado. Paga, ou expira.
  PENDING: ['PROCESSING', 'CANCELLED'],
  // Paga. Sai pelos correios ou fica a espera na loja; cancelar implica reembolso.
  PROCESSING: ['SHIPPED', 'READY_PICKUP', 'CANCELLED'],
  SHIPPED: ['COMPLETED'],
  READY_PICKUP: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function podePassar(de: Estado, para: Estado): boolean {
  return TRANSICOES[de].includes(para);
}

/** Quem mudou o estado. Fica no historico, com a data. */
export type Autor = 'sistema' | 'cliente' | `admin:${string}`;

/** O numero que a pessoa ve: `2026-000123`. Nao e o `_id`, nem e a fatura. */
export function formatarNumero(ano: number, sequencia: number): string {
  return `${ano}-${String(sequencia).padStart(6, '0')}`;
}
