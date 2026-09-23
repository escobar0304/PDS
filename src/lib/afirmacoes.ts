/**
 * O que o sitio afirma sobre o negocio.
 *
 * Fonte unica, como `empresa.ts` e para a identificacao. Uma afirmacao
 * comercial que nao seja verdade e uma pratica comercial desleal (DL 57/2008),
 * com ou sem loja a funcionar — e o sitio tinha varias, escritas por um
 * gerador e nao pelo negocio: "Envio Gratis acima de 50€", "Entrega em 2-3
 * dias uteis", "Certificado de autenticidade incluido", "gemologistas
 * certificados", "100% autenticos", "Limpeza energetica antes do envio", "Ha
 * mais de uma decada", "Stripe SSL certificado" (sem checkout), e
 * "praticas eticas e sustentaveis na extracao".
 *
 * **Isto e texto geral, de proposito.** Nao promete prazos, custos,
 * certificados nem origem. Quando o negocio tiver essa informacao, muda-se
 * aqui e muda em todas as paginas. O teste `afirmacoes.test.ts` falha se
 * alguma das frases retiradas voltar a aparecer numa pagina.
 *
 * A unica afirmacao concreta que fica e a dos 14 dias de livre resolucao, e
 * fica porque nao e uma promessa do negocio: e um direito que a lei da em
 * qualquer venda a distancia (DL 24/2014, art. 10.º).
 */

export interface Informacao {
  titulo: string;
  detalhe: string;
}

/** Ao lado da loja, do produto e do carrinho. */
export const INFORMACAO_COMPRA = {
  // Decidido pelo negocio: continente, CTT, portes pelo peso. Os detalhes
  // (tabela, prazo) estao em `condicoes.ts` e em /envios.
  envios: {
    titulo: 'Envios',
    detalhe: 'Para Portugal continental, pelos CTT. Portes pelo peso',
  },
  livreResolucao: {
    titulo: 'Livre resolução',
    detalhe: '14 dias para desistir da compra, nos termos da lei',
  },
  duvidas: {
    titulo: 'Dúvidas',
    detalhe: 'Pode escrever-nos antes de escolher',
  },
} satisfies Record<string, Informacao>;

/**
 * O aviso que acompanha tudo o que se diga sobre propriedades dos cristais.
 *
 * Alegacoes de efeito terapeutico ou de saude sobre cristais sao territorio
 * de publicidade enganosa. O que se diz fica no campo da tradicao e do
 * bem-estar, e diz-se que nao substitui aconselhamento medico — sempre que
 * houver propriedades a vista, e nao so numa pagina que ninguem le.
 */
export const AVISO_TRADICAO =
  'As propriedades atribuídas aos cristais vêm da tradição e de práticas de ' +
  'bem-estar. Não substituem aconselhamento, diagnóstico ou tratamento médico.';

/** Descricao curta do sitio, para metadados e rodape. */
export const DESCRICAO_SITIO =
  'Cristais e pedras para ter por perto. Cada peça é diferente da outra.';

/**
 * Frases retiradas, que nao podem voltar sem o negocio as confirmar.
 *
 * Nao sao proibidas para sempre: sao proibidas enquanto ninguem as
 * sustentar. Quando uma for verdade e houver com que a provar, sai daqui e
 * entra acima.
 */
export const RETIRADAS: { frase: RegExp; porque: string }[] = [
  { frase: /envio grátis/i, porque: 'custo de envio que ninguém decidiu' },
  { frase: /\d\s*-\s*\d\s*dias úteis/i, porque: 'prazo de entrega que ninguém decidiu' },
  { frase: /certificad[oa]s?/i, porque: 'certificado ou certificação que não existe' },
  { frase: /gemolog/i, porque: 'serviço de avaliação gemológica que não existe' },
  { frase: /autêntic/i, porque: 'garantia de autenticidade sem prova' },
  { frase: /limpeza energética/i, porque: 'serviço que ninguém confirmou prestar' },
  { frase: /mais de uma década/i, porque: 'antiguidade do negócio por confirmar' },
  { frase: /sustentáve/i, porque: 'alegação ambiental genérica (Diretiva 2024/825)' },
  {
    frase: /pagamento seguro/i,
    // O negocio quer escreve-lo, e vai ser verdade — com a Stripe, na v2.
    // Ate la seria afirmar a seguranca de um pagamento que nao existe.
    porque: 'não há pagamento: entra quando o checkout existir',
  },
  { frase: /pedras? preciosas?/i, porque: 'quartzo e ametista não são pedras preciosas' },
  { frase: /benefícios energéticos/i, porque: 'alegação de efeito, em vez de tradição' },
  { frase: /atendimento personalizado/i, porque: 'serviço que ninguém confirmou prestar' },
  {
    frase: /\b\d{1,2}h\s*(-|às)/i,
    porque: 'horário escrito à mão: vive em EMPRESA.horario, e só aparece quando existir',
  },
];
