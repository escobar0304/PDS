import type { EncomendaVista } from '@/lib/encomenda';

export interface EstadoParaPessoa {
  titulo: string;
  detalhe: string;
  tom: 'sucesso' | 'info' | 'erro';
  /** A pagina volta a perguntar enquanto isto for verdade. */
  aEsperar: boolean;
}

/**
 * O estado da encomenda dito a quem comprou. **So o que e verdade agora**:
 * "paga" so depois do aviso da Stripe, e nunca porque a pessoa voltou da
 * pagina de pagamento — essa volta qualquer um a faz a mao.
 */
export function estadoParaPessoa(
  e: Pick<
    EncomendaVista,
    'status' | 'paymentStatus' | 'pagoDepoisDeCancelada' | 'pagamentoDivergente' | 'confirmacaoEnviada' | 'customerEmail'
  > & { seguimento?: string }
): EstadoParaPessoa {
  if (e.pagamentoDivergente) {
    return {
      titulo: 'Recebemos um pagamento com um valor diferente do total',
      detalhe: 'A encomenda não avançou. A loja foi avisada e vai resolver consigo.',
      tom: 'erro',
      aEsperar: false,
    };
  }
  if (e.pagoDepoisDeCancelada) {
    return {
      titulo: 'O pagamento chegou depois de a reserva expirar',
      detalhe:
        'A encomenda já tinha sido cancelada. A loja foi avisada: ou confirma que ainda tem as peças e envia-as, ou devolve o valor pago.',
      tom: 'erro',
      aEsperar: false,
    };
  }
  const email = e.confirmacaoEnviada
    ? `Enviámos a confirmação para ${e.customerEmail}.`
    : `A confirmação segue por email para ${e.customerEmail}.`;
  switch (e.status) {
    case 'PENDING':
      return {
        titulo: 'À espera da confirmação do pagamento',
        detalhe:
          'Se acabou de pagar, a confirmação chega em segundos e esta página muda sozinha. Não pague outra vez.',
        tom: 'info',
        aEsperar: true,
      };
    case 'PROCESSING':
      return { titulo: 'Paga. Estamos a preparar a encomenda', detalhe: email, tom: 'sucesso', aEsperar: false };
    case 'SHIPPED':
      return {
        titulo: 'Enviada',
        detalhe: e.seguimento
          ? `A encomenda já saiu, pelos CTT. Número de seguimento: ${e.seguimento}.`
          : 'A encomenda já saiu, pelos CTT.',
        tom: 'sucesso',
        aEsperar: false,
      };
    case 'READY_PICKUP':
      return { titulo: 'Pronta para levantar', detalhe: 'Pode levantá-la na loja.', tom: 'sucesso', aEsperar: false };
    case 'COMPLETED':
      return { titulo: 'Entregue', detalhe: 'A encomenda foi entregue.', tom: 'sucesso', aEsperar: false };
    case 'CANCELLED':
      return {
        titulo: 'Cancelada',
        detalhe:
          e.paymentStatus === 'PENDING' || e.paymentStatus === 'FAILED'
            ? 'Não chegou a ser paga, e nada foi cobrado. As peças voltaram a estar à venda.'
            : e.paymentStatus === 'REFUNDED'
              ? 'O valor pago foi devolvido.'
              : 'A loja vai devolver o valor pago, pelo mesmo meio de pagamento.',
        tom: 'info',
        aEsperar: false,
      };
  }
}
