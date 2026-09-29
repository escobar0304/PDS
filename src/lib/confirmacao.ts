import { CONDICOES, PRAZOS_LEGAIS } from '@/lib/condicoes';
import { formatarPreco } from '@/lib/dinheiro';
import { EMPRESA, moradaFormatada } from '@/lib/empresa';
import { LIVRO_RECLAMACOES } from '@/lib/paginas';

/**
 * Os textos dos emails de uma encomenda (ROADMAP-V2, P1). So texto, sem
 * enviar nada: `lib/avisos.ts` envia.
 *
 * **A confirmacao e obrigatoria** (DL 24/2014, art. 6.º): em suporte
 * duradouro, com a informacao pre-contratual e o formulario de livre
 * resolucao. Uma ligacao para /termos nao chega — a pagina muda, e o email
 * tem de dizer o que valia no dia da compra. Por isso vai tudo no proprio
 * texto. Os mesmos principios e as mesmas palavras que /envios.
 *
 * Texto simples, como todo o correio do sitio (`services/mailer.ts`): o nome
 * e a morada vem de quem comprou, e sem HTML nao ha onde os injetar.
 *
 * **Nao sou jurista:** a estrutura segue o art. 4.º e o anexo do DL 24/2014,
 * e tem de ser validada antes de abrir a loja.
 */

export interface EncomendaParaAviso {
  numero: string;
  criadaEm: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: string;
  shippingPostal?: string;
  shippingCity?: string;
  items: { name: string; medida?: string; priceCents: number; quantity: number }[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}

const FALTA = '(por preencher)';

const dataLonga = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'long', timeZone: 'Europe/Lisbon' });

function linhas(e: EncomendaParaAviso): string[] {
  return [
    ...e.items.map((l) => {
      const nome = l.medida ? `${l.name}, medida ${l.medida}` : l.name;
      return `  ${nome} — ${l.quantity} × ${formatarPreco(l.priceCents)} = ${formatarPreco(l.priceCents * l.quantity)}`;
    }),
    `  Portes (${CONDICOES.transportadora}): ${formatarPreco(e.shippingCents)}`,
    `  Total pago, com IVA: ${formatarPreco(e.totalCents)}`,
  ];
}

function morada(e: EncomendaParaAviso): string[] {
  return [
    `  ${e.customerName}`,
    `  ${e.shippingAddress ?? FALTA}`,
    `  ${e.shippingPostal ?? ''} ${e.shippingCity ?? ''}`.trimEnd(),
  ].filter((l) => l.trim());
}

/** O modelo do anexo do DL 24/2014, com a encomenda ja preenchida. */
export function formularioLivreResolucao(e: Pick<EncomendaParaAviso, 'numero' | 'criadaEm'>): string[] {
  return [
    `  Para: ${EMPRESA.denominacao ?? FALTA}, ${moradaFormatada() ?? FALTA}, ${EMPRESA.email ?? FALTA}`,
    '  Pela presente comunico que resolvo o meu contrato de compra e venda do(s)',
    '  seguinte(s) bem(ns): …',
    `  Encomenda n.º ${e.numero}, feita em ${dataLonga.format(e.criadaEm)}; recebida em …`,
    '  Nome: …',
    '  Morada: …',
    '  Assinatura (só se enviar em papel): …',
    '  Data: …',
  ];
}

/** O email a quem comprou, com o pagamento confirmado. */
export function textoDaConfirmacao(
  e: EncomendaParaAviso,
  { prazoEntrega, ligacao }: { prazoEntrega: string; ligacao: string | null }
): { assunto: string; texto: string } {
  const { livreResolucaoDias: dias, reembolsoDias, garantiaAnos } = PRAZOS_LEGAIS;
  const texto = [
    `Olá ${e.customerName},`,
    '',
    `Recebemos o pagamento da encomenda n.º ${e.numero}, feita em ${dataLonga.format(e.criadaEm)}.`,
    'Guarde este email: é a confirmação da compra, com as condições em que foi feita.',
    '',
    'A ENCOMENDA',
    ...linhas(e),
    '',
    'A ENTREGA',
    `  Por envio, pelos ${CONDICOES.transportadora}, para ${CONDICOES.zonaEnvio}. Prazo: ${prazoEntrega}.`,
    ...morada(e),
    `  Telefone para a entrega: ${e.customerPhone}`,
    ...(ligacao ? ['', `O estado da encomenda está aqui: ${ligacao}`] : []),
    '',
    'DESISTIR DA COMPRA',
    `  Tem ${dias} dias, a contar do dia em que recebe a encomenda, para desistir`,
    '  da compra sem dar nenhuma razão. Basta dizer-nos por escrito: responder a',
    '  este email chega. Pode usar o formulário abaixo, mas não é obrigatório.',
    `  Depois de nos dizer, tem ${dias} dias para nos devolver as peças.`,
    ...(CONDICOES.devolucaoPagaPeloCliente ? ['  Os portes da devolução ficam a seu cargo.'] : []),
    '  Devolvemos tudo o que pagou, incluindo os portes de envio da opção mais',
    `  barata, até ${reembolsoDias} dias depois de sabermos que desistiu, pelo mesmo meio`,
    '  de pagamento. Podemos esperar até recebermos as peças, ou até nos mostrar',
    '  que as enviou.',
    '',
    'FORMULÁRIO DE LIVRE RESOLUÇÃO (só se o quiser usar)',
    ...formularioLivreResolucao(e),
    '',
    'GARANTIA',
    `  Todas as peças têm ${garantiaAnos} anos de garantia legal de conformidade`,
    '  (Decreto-Lei n.º 84/2021).',
    '',
    'QUEM VENDE',
    `  ${EMPRESA.denominacao ?? FALTA}, NIF ${EMPRESA.nif ?? FALTA}`,
    `  ${moradaFormatada() ?? FALTA}`,
    `  ${EMPRESA.email ?? FALTA} · ${EMPRESA.telefone ?? FALTA}`,
    ...(EMPRESA.entidadeRal
      ? [`  Resolução de litígios: ${EMPRESA.entidadeRal.nome}, ${EMPRESA.entidadeRal.sitio}`]
      : []),
    `  Livro de Reclamações Eletrónico: ${LIVRO_RECLAMACOES.href}`,
  ].join('\n');

  return { assunto: `Encomenda n.º ${e.numero} confirmada — Pétalas de Sonho`, texto };
}

export type AvisoLoja = 'paga' | 'paga-depois-de-cancelada' | 'valor-divergente';

/**
 * O email para a loja. Enquanto nao houver painel de encomendas (P3), e por
 * aqui que a loja sabe que tem uma encomenda para preparar — ou um pagamento
 * para resolver.
 */
export function textoParaALoja(
  e: EncomendaParaAviso,
  tipo: AvisoLoja,
  pagoCents?: number | null
): { assunto: string; texto: string } {
  const cabeca: Record<AvisoLoja, { assunto: string; texto: string[] }> = {
    paga: {
      assunto: `Encomenda paga: ${e.numero} — ${formatarPreco(e.totalCents)}`,
      texto: ['Uma encomenda nova, paga e à espera de ser preparada.'],
    },
    'paga-depois-de-cancelada': {
      assunto: `A resolver: ${e.numero} foi paga depois de cancelada`,
      texto: [
        'O pagamento chegou depois de a reserva expirar: a encomenda já estava',
        'cancelada, e as peças voltaram ao stock — podem já ter sido vendidas.',
        'Ou se confirma que ainda há as peças e se envia, ou se reembolsa pela',
        'Stripe. Nada disto acontece sozinho.',
      ],
    },
    'valor-divergente': {
      assunto: `A resolver: ${e.numero} tem um pagamento com outro valor`,
      texto: [
        `O valor pago (${pagoCents == null ? 'desconhecido' : formatarPreco(pagoCents)}) não é o total da encomenda`,
        `(${formatarPreco(e.totalCents)}). A encomenda não avançou. Ver na Stripe.`,
      ],
    },
  };
  const c = cabeca[tipo];
  const texto = [
    ...c.texto,
    '',
    `Encomenda n.º ${e.numero}, feita em ${dataLonga.format(e.criadaEm)}`,
    ...linhas(e),
    '',
    'Para:',
    ...morada(e),
    `  ${e.customerEmail} · ${e.customerPhone}`,
  ].join('\n');
  return { assunto: c.assunto, texto };
}

/** A encomenda saiu: o numero de seguimento, e o que fazer se nao chegar. */
export function textoDaExpedicao(e: EncomendaParaAviso, seguimento: string): { assunto: string; texto: string } {
  return {
    assunto: `Encomenda n.º ${e.numero} enviada — Pétalas de Sonho`,
    texto: [
      `Olá ${e.customerName},`,
      '',
      `A encomenda n.º ${e.numero} saiu hoje, pelos ${CONDICOES.transportadora}, para:`,
      ...morada(e),
      '',
      `Número de seguimento: ${seguimento}`,
      `Pode segui-la no sítio dos ${CONDICOES.transportadora}, com este número.`,
      '',
      `Os ${PRAZOS_LEGAIS.livreResolucaoDias} dias para desistir da compra contam a partir do dia em que a`,
      'receber. Para isso, ou se alguma coisa chegar mal, basta responder a este email.',
    ].join('\n'),
  };
}

/** O valor foi devolvido. */
export function textoDoReembolso(e: EncomendaParaAviso): { assunto: string; texto: string } {
  return {
    assunto: `Encomenda n.º ${e.numero}: valor devolvido — Pétalas de Sonho`,
    texto: [
      `Olá ${e.customerName},`,
      '',
      `A encomenda n.º ${e.numero} foi cancelada, e devolvemos ${formatarPreco(e.totalCents)}`,
      'pelo mesmo meio com que pagou. O banco pode demorar alguns dias a mostrar',
      'o valor de volta.',
      '',
      'Se tiver alguma dúvida, basta responder a este email.',
    ].join('\n'),
  };
}
