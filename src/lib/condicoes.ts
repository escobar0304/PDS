/**
 * As condicoes comerciais: envios, devolucoes, precos.
 *
 * Fonte unica, como `empresa.ts` para a identificacao e `afirmacoes.ts` para o
 * resto do texto comercial. `/envios` e `/termos` leem daqui.
 *
 * Decidido pelo negocio em 23/09/2026. O que ficou por decidir e `null`, a
 * pagina mostra "por preencher", e o `robots.ts` nao deixa indexar enquanto
 * faltar — sao condicoes que a lei exige que se digam antes da compra
 * (DL 24/2014, art. 4.º), e uma pagina de envios com os portes em branco nao
 * pode ir para os motores de busca.
 */

import { tabelaValida } from '@/lib/portes';

type PorPreencher = null;

/** Um escalao da tabela de portes. Em gramas e centimos: faz-se contas com ele. */
export interface Escalao {
  ateGramas: number;
  precoCents: number;
}

export const CONDICOES = {
  /** Para onde se envia. */
  zonaEnvio: 'Portugal continental',
  /** Com quem. */
  transportadora: 'CTT',
  /**
   * Expedicao no proprio dia, em dias uteis, dentro do horario de expediente.
   *
   * Falta a hora-limite: "horario util" depende do horario da loja, que esta
   * a `null` em `empresa.ts`. Ate la, a pagina diz o principio sem a hora.
   */
  expedicaoNoProprioDia: true,
  horaLimiteExpedicao: null as string | PorPreencher,
  /**
   * O prazo de entrega depende do servico dos CTT (correio normal, registado,
   * expresso), e o servico nao esta decidido. O DL 24/2014 obriga a dizer o
   * prazo antes da compra: e por isso que isto bloqueia a indexacao.
   */
  prazoEntrega: null as string | PorPreencher,
  /** Os portes dependem do peso da encomenda. */
  portesPorPeso: true,
  /**
   * A tabela, por escaloes de peso. Falta. Cada escalao cobre ate
   * `ateGramas`, inclusive, e os escaloes vao por ordem crescente — ha um
   * teste que o verifica no dia em que for preenchida.
   */
  tabelaPortes: null as Escalao[] | PorPreencher,
  /**
   * Quem paga a devolucao, no direito de livre resolucao. Por lei, o cliente
   * — **se isso lhe for dito antes da compra** (DL 24/2014, art. 13.º, n.º 2).
   * Se nao for dito, paga a loja. Esta e a razao de estar escrito.
   */
  devolucaoPagaPeloCliente: true,
  /**
   * Excecao a livre resolucao para pecas personalizadas (art. 17.º, n.º 1,
   * al. c)). **Desligada.** O negocio disse que as pecas "vao ter medida e as
   * pessoas escolhem": escolher um tamanho de uma lista nao e uma peca
   * confecionada segundo as especificacoes de quem compra. Se houver pecas
   * feitas por encomenda, a excecao aplica-se so a essas e tem de ser dita em
   * cada uma — nunca em bloco. Negar um direito por engano e ilegal; nao usar
   * uma excecao so custa uma devolucao.
   */
  excecaoPersonalizadas: false,
  /** Os precos mostrados ja incluem o IVA. */
  precosComIva: true,
  /** Ha loja fisica: a morada e o horario vem de `empresa.ts`. */
  lojaFisica: true,
  /** Se se pode levantar a encomenda na loja. Nao perguntado ainda. */
  levantamentoNaLoja: null as boolean | PorPreencher,
  /**
   * Como se paga. Nao ha checkout nesta versao: entra na v2 (ROADMAP-V2, E4). E
   * por isso que "pagamento seguro" nao se escreve ainda — seria afirmar a
   * seguranca de uma coisa que nao existe.
   */
  meiosPagamento: null as string[] | PorPreencher,
  /** A loja online ainda nao aceita encomendas. */
  encomendasOnline: false,
} as const;

/** Prazos que sao da lei, e nao decisoes do negocio. */
export const PRAZOS_LEGAIS = {
  /** DL 24/2014, art. 10.º: a contar da rececao do bem. */
  livreResolucaoDias: 14,
  /** DL 24/2014, art. 12.º: reembolso ate 14 dias depois de sabermos. */
  reembolsoDias: 14,
  /** DL 84/2021: garantia legal de conformidade dos bens. */
  garantiaAnos: 3,
} as const;

/** O que falta para as condicoes poderem ir para o ar, e porque. */
export function condicoesEmFalta(): { campo: string; porque: string }[] {
  const faltas: { campo: string; porque: string }[] = [];
  if (CONDICOES.prazoEntrega === null) {
    faltas.push({ campo: 'prazoEntrega', porque: 'DL 24/2014 art. 4.º: prazo de entrega' });
  }
  if (CONDICOES.tabelaPortes === null) {
    faltas.push({ campo: 'tabelaPortes', porque: 'DL 24/2014 art. 4.º: custos de envio' });
  } else if (!tabelaValida(CONDICOES.tabelaPortes)) {
    // Preenchida mas mal: escaloes fora de ordem ou precos em euros. Uma
    // tabela com que nao se fazem contas certas nao conta como preenchida.
    faltas.push({ campo: 'tabelaPortes', porque: 'escalões fora de ordem ou valores que não são inteiros' });
  }
  return faltas;
}

export function condicoesCompletas(): boolean {
  return condicoesEmFalta().length === 0;
}
