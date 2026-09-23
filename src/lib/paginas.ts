/**
 * As paginas institucionais e o estado de cada uma.
 *
 * O rodapé ligava para `/termos`, `/envios`, `/faq` e `/contacto` — quatro
 * paginas que nao existiam. Quatro 404 no rodape de todas as paginas do site.
 *
 * Havia tres saidas e nenhuma era obvia:
 *
 * 1. Deixar os 404. E o que estava, e o que parece a quem visita e um site
 *    partido
 * 2. Criar paginas a dizer "em preparacao". Troca um 404 por uma promessa por
 *    cumprir, e uma pagina legal a fingir e pior do que nenhuma — quem a
 *    encontre pode pensar que ja tem valor
 * 3. O rodape so mostrar o que existe, e o site nao poder ir para o ar sem as
 *    que sao obrigatorias
 *
 * A terceira. O rodape deixa de mentir hoje, e o `robots.ts` garante que a
 * falta nao passa despercebida amanha.
 */

export interface PaginaInstitucional {
  href: string;
  rotulo: string;
  /** Falso enquanto a pagina nao existir no repositorio. */
  existe: boolean;
  /**
   * Se e exigida por lei antes de o sitio poder ser publicado. As que nao sao
   * podem faltar sem bloquear nada.
   */
  obrigatoria: boolean;
  /** Porque falta, para quem vier a seguir nao ter de adivinhar. */
  porQueFalta?: string;
}

export const PAGINAS: PaginaInstitucional[] = [
  { href: '/privacidade', rotulo: 'Política de Privacidade', existe: true, obrigatoria: true },
  { href: '/cookies', rotulo: 'Cookies', existe: true, obrigatoria: false },
  { href: '/contacto', rotulo: 'Contactos', existe: true, obrigatoria: true },
  {
    href: '/termos',
    rotulo: 'Termos e Condições',
    existe: false,
    obrigatoria: true,
    porQueFalta:
      'Precisa de decisões do negócio: condições de venda, prazos, garantias, ' +
      'e a entidade de resolução alternativa de litígios (Lei 144/2015).',
  },
  {
    href: '/envios',
    rotulo: 'Envios e Devoluções',
    existe: false,
    obrigatoria: true,
    porQueFalta:
      'Precisa de decisões do negócio: portes, prazos de entrega e como se ' +
      'processa o direito de livre resolução (DL 24/2014).',
  },
  {
    href: '/faq',
    rotulo: 'Perguntas Frequentes',
    existe: true,
    obrigatoria: false,
  },
];

/**
 * Ligacao permanente e externa ao livro de reclamacoes.
 *
 * O DL 156/2005 exige a ligacao para a plataforma em local visivel. Nao exige
 * pagina propria — esta ligacao cumpre.
 */
export const LIVRO_RECLAMACOES = {
  href: 'https://www.livroreclamacoes.pt',
  rotulo: 'Livro de Reclamações',
};

/** O que o rodape pode mostrar sem enviar ninguem para um 404. */
export function paginasDisponiveis(): PaginaInstitucional[] {
  return PAGINAS.filter((p) => p.existe);
}

/** As obrigatorias que ainda nao existem, com a razao. */
export function paginasEmFalta(): PaginaInstitucional[] {
  return PAGINAS.filter((p) => p.obrigatoria && !p.existe);
}

export function paginasObrigatoriasProntas(): boolean {
  return paginasEmFalta().length === 0;
}
