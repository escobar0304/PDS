import type { Problema } from '@/lib/encomenda';
import { formatarPreco } from '@/lib/dinheiro';

/** O que o carrinho sabe de cada linha, para dar nome aos problemas. */
export interface LinhaConhecida {
  _id: string;
  varianteId: string;
  name: string;
  medida?: string;
}

function nomeDe(linhas: readonly LinhaConhecida[], id: string, varianteId?: string): string {
  const l =
    linhas.find((x) => x._id === id && (varianteId === undefined || x.varianteId === varianteId)) ??
    linhas.find((x) => x._id === id);
  if (!l) return 'Uma das peças';
  return l.medida ? `${l.name}, medida ${l.medida}` : l.name;
}

/**
 * Cada problema do calculo (`lib/encomenda.ts`) em portugues, com o nome da
 * peca e o que a pessoa pode fazer. Sem codigos: quem compra nao tem de saber
 * o que e um `varianteId`.
 */
export function mensagemDoProblema(p: Problema, linhas: readonly LinhaConhecida[]): string {
  switch (p.tipo) {
    case 'indisponivel':
      return `${nomeDe(linhas, p.id, p.varianteId)} já não está à venda. Tire-a do carrinho para continuar.`;
    case 'medida-por-escolher':
      return `${nomeDe(linhas, p.id)}: falta escolher a medida, na página da peça.`;
    case 'stock':
      return p.disponivel === 0
        ? `${nomeDe(linhas, p.id, p.varianteId)} esgotou. Tire-a do carrinho para continuar.`
        : `${nomeDe(linhas, p.id, p.varianteId)}: só há ${p.disponivel}. Diminua a quantidade no carrinho.`;
    case 'sem-peso':
      // Falta do lado da loja, e nao de quem compra: diz-se assim.
      return `Não conseguimos calcular os portes de ${nomeDe(linhas, p.id)}. Fale connosco para a encomendar.`;
    case 'acima-do-ultimo-escalao':
      return 'A encomenda passa do peso máximo que enviamos de uma vez. Divida-a em duas, ou fale connosco.';
    case 'sem-tabela':
      return 'Os portes ainda não estão definidos.';
    case 'total-mudou':
      return `O total mudou para ${formatarPreco(p.totalCents)} desde que o viu. Confirme o novo total antes de encomendar.`;
  }
}
