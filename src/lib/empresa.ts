/**
 * Identificacao do prestador de servicos.
 *
 * Fonte unica. Tudo o que precise destes dados — a politica de privacidade, a
 * identificacao obrigatoria, o livro de reclamacoes, o rodape, os emails — le
 * daqui. Preencher isto uma vez chega.
 *
 * Base legal para o que e obrigatorio estar acessivel de forma permanente e
 * direta: DL 7/2004 (comercio eletronico), art. 10.
 *
 * O negocio e um empresario em nome individual, nao uma sociedade, por isso
 * nao ha conservatoria, numero de matricula nem capital social a indicar.
 */

/**
 * Um campo por preencher e `null`, nunca uma cadeia vazia nem um valor
 * inventado. A diferenca importa: `null` e "ainda nao sei", e o site sabe
 * mostrar isso como tal em vez de publicar um telefone que nao existe.
 *
 * Ate aqui o rodape tinha `+351 xxx xxx xxx` e `tel:+351000000000` — um
 * numero a fingir, que chegou a producao porque ninguem tinha onde dizer que
 * faltava.
 */
export type PorPreencher = null;

export interface Empresa {
  /** Nome do empresario, como consta no registo. */
  denominacao: string | PorPreencher;
  /** Numero de identificacao fiscal. */
  nif: string | PorPreencher;
  /** Domicilio profissional. */
  morada: {
    linha: string | PorPreencher;
    codigoPostal: string | PorPreencher;
    localidade: string | PorPreencher;
    pais: string;
  };
  /** Email de contacto efetivo, no sentido do art. 10 do DL 7/2004. */
  email: string | PorPreencher;
  /** Telefone de contacto efetivo. */
  telefone: string | PorPreencher;
  /**
   * Entidade de resolucao alternativa de litigios a que aderiu.
   *
   * Informar qual e obrigatorio (Lei 144/2015, art. 18). Para uma morada no
   * Porto o candidato natural e o CICAP, mas a adesao tem de ser confirmada e
   * e uma decisao do negocio, nao uma suposicao do codigo.
   *
   * Nota: a plataforma europeia de resolucao de litigios em linha foi
   * descontinuada em julho de 2025. Nao acrescentar ligacao para ela.
   */
  entidadeRal: { nome: string; sitio: string } | PorPreencher;
}

export const EMPRESA: Empresa = {
  denominacao: null,
  nif: null,
  morada: {
    linha: null,
    codigoPostal: null,
    localidade: null,
    pais: 'Portugal',
  },
  email: null,
  telefone: null,
  entidadeRal: null,
};

/** Campos sem os quais o site nao pode ir para o ar indexado. */
const OBRIGATORIOS: { caminho: string; valor: unknown; porque: string }[] = [
  {
    caminho: 'denominacao',
    valor: EMPRESA.denominacao,
    porque: 'DL 7/2004 art. 10: nome do prestador',
  },
  { caminho: 'nif', valor: EMPRESA.nif, porque: 'DL 7/2004 art. 10: NIF' },
  {
    caminho: 'morada.linha',
    valor: EMPRESA.morada.linha,
    porque: 'DL 7/2004 art. 10: domicílio',
  },
  {
    caminho: 'morada.codigoPostal',
    valor: EMPRESA.morada.codigoPostal,
    porque: 'DL 7/2004 art. 10: domicílio',
  },
  {
    caminho: 'morada.localidade',
    valor: EMPRESA.morada.localidade,
    porque: 'DL 7/2004 art. 10: domicílio',
  },
  {
    caminho: 'email',
    valor: EMPRESA.email,
    porque: 'DL 7/2004 art. 10: contacto eletrónico efetivo',
  },
  {
    caminho: 'telefone',
    valor: EMPRESA.telefone,
    porque: 'DL 7/2004 art. 10: contacto efetivo',
  },
  {
    caminho: 'entidadeRal',
    valor: EMPRESA.entidadeRal,
    porque: 'Lei 144/2015 art. 18: entidade de resolução alternativa de litígios',
  },
];

/** Os campos obrigatorios que ainda faltam, com a razao de cada um. */
export function camposEmFalta(): { caminho: string; porque: string }[] {
  return OBRIGATORIOS.filter((c) => c.valor === null || c.valor === '').map(
    ({ caminho, porque }) => ({ caminho, porque }),
  );
}

/** true quando ha dados suficientes para o site poder ser publicado. */
export function identificacaoCompleta(): boolean {
  return camposEmFalta().length === 0;
}

/** Morada em texto corrido, ou null enquanto faltar alguma parte. */
export function moradaFormatada(): string | null {
  const { linha, codigoPostal, localidade, pais } = EMPRESA.morada;
  if (!linha || !codigoPostal || !localidade) return null;
  return `${linha}, ${codigoPostal} ${localidade}, ${pais}`;
}
