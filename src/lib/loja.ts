import { CONDICOES, condicoesEmFalta, type Escalao } from '@/lib/condicoes';
import { camposEmFalta } from '@/lib/empresa';
import { paginasEmFalta } from '@/lib/paginas';

/**
 * Se a loja online pode aceitar encomendas, e porque nao (ROADMAP-V2, E5).
 *
 * Fonte unica, como o `robots.ts` para a indexacao: o carrinho, a pagina de
 * checkout e as rotas de encomenda perguntam aqui, e nenhuma decide sozinha.
 * Uma rota que abrisse com a pagina fechada vendia sem a informacao que a lei
 * pede antes da compra.
 */

export interface Falta {
  campo: string;
  porque: string;
}

/**
 * A confirmacao da encomenda em suporte duradouro, com as condicoes e o
 * formulario de livre resolucao, e obrigatoria (DL 24/2014, art. 6.º). Vem
 * com a P1, e depende do fornecedor de email. Ate la nao se vende: seria
 * vender sem cumprir o que a lei exige logo a seguir a venda.
 */
export const CONFIRMACAO_DURADOURA = false;

/** O que a loja precisa para vender: os portes e o prazo que se mostram. */
export interface CondicoesDeVenda {
  tabelaPortes: readonly Escalao[];
  prazoEntrega: string;
}

/** O ambiente, ou a parte dele que interessa: os testes passam o seu. */
type Ambiente = Record<string, string | undefined>;

export type EstadoLoja =
  | { aberta: true; ensaio: boolean; condicoes: CondicoesDeVenda }
  | { aberta: false; faltas: Falta[] };

/**
 * **O ensaio.** Sem tabela de portes nem prazo de entrega, a loja fica
 * fechada, e com ela o checkout inteiro fica sem teste de ponta a ponta ate
 * ao dia em que abrir — o pior dia para descobrir um erro. O ensaio abre-a
 * com estes valores, **que sao inventados e dizem-no**, para os testes
 * `e2e-bd` percorrerem a compra contra o simulador da Stripe.
 *
 * Tres travoes, para nunca vender a serio com eles:
 * - so com `LOJA_ENSAIO=1` no ambiente;
 * - so com uma chave de testes da Stripe (`sk_test_`): com ela nenhum
 *   dinheiro se move. Com uma chave real, o ensaio fecha a loja em vez de a
 *   abrir;
 * - a pagina mostra que e um ensaio, e o `robots.ts` nao deixa indexar.
 */
export const CONDICOES_DE_ENSAIO: CondicoesDeVenda = {
  tabelaPortes: [
    { ateGramas: 2000, precoCents: 450 },
    { ateGramas: 10000, precoCents: 900 },
  ],
  prazoEntrega: 'ensaio: não há prazo real',
};

/** Se o ambiente pede o ensaio. Nao diz se ele e aceite: ver `estadoDaLoja`. */
export function ensaioPedido(env: Ambiente = process.env): boolean {
  return env.LOJA_ENSAIO === '1';
}

function faltasDeConfiguracao(env: Ambiente): Falta[] {
  const faltas: Falta[] = [];
  if (!env.STRIPE_SECRET_KEY) {
    faltas.push({ campo: 'STRIPE_SECRET_KEY', porque: 'sem ela não há pagamento' });
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    faltas.push({
      campo: 'STRIPE_WEBHOOK_SECRET',
      porque: 'sem ela nenhum pagamento chega a ser confirmado',
    });
  }
  return faltas;
}

/**
 * O estado, a partir do negocio (`condicoes.ts`, `empresa.ts`, `paginas.ts`)
 * e do ambiente. Devolve **todas** as faltas, para o painel as poder mostrar
 * de uma vez.
 */
export function estadoDaLoja(env: Ambiente = process.env): EstadoLoja {
  const configuracao = faltasDeConfiguracao(env);

  if (ensaioPedido(env)) {
    if (env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      return {
        aberta: false,
        faltas: [{ campo: 'LOJA_ENSAIO', porque: 'o ensaio só abre com uma chave de testes da Stripe' }],
      };
    }
    if (configuracao.length > 0) return { aberta: false, faltas: configuracao };
    return { aberta: true, ensaio: true, condicoes: CONDICOES_DE_ENSAIO };
  }

  const faltas: Falta[] = [];
  if (!CONDICOES.encomendasOnline) {
    faltas.push({ campo: 'encomendasOnline', porque: 'a decisão de abrir a loja online' });
  }
  faltas.push(...condicoesEmFalta());
  faltas.push(
    ...camposEmFalta().map((c) => ({
      campo: c.caminho,
      // Os mesmos dados que o rodape: o DL 24/2014, art. 4.º, pede-os antes
      // da compra, alem do DL 7/2004 que ja os pedia no sitio.
      porque: `${c.porque}; também DL 24/2014 art. 4.º`,
    }))
  );
  faltas.push(
    ...paginasEmFalta().map((p) => ({ campo: p.href, porque: p.porQueFalta ?? 'página obrigatória' }))
  );
  if (!CONFIRMACAO_DURADOURA) {
    faltas.push({
      campo: 'confirmação por email',
      porque: 'DL 24/2014 art. 6.º: confirmar em suporte duradouro (ROADMAP-V2, P1)',
    });
  }
  faltas.push(...configuracao);

  // Com as faltas vazias, a tabela e o prazo estao preenchidos: e o que
  // `condicoesEmFalta` verifica.
  if (faltas.length > 0 || CONDICOES.tabelaPortes === null || CONDICOES.prazoEntrega === null) {
    return { aberta: false, faltas };
  }
  return {
    aberta: true,
    ensaio: false,
    condicoes: { tabelaPortes: CONDICOES.tabelaPortes, prazoEntrega: CONDICOES.prazoEntrega },
  };
}
