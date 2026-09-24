import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { CONDICOES, type Escalao } from '@/lib/condicoes';
import { Product } from '@/lib/models';
import { portesPara } from '@/lib/portes';

/**
 * O total de uma encomenda, calculado no servidor (ROADMAP-V2, E1).
 *
 * O carrinho guarda no browser o preco que o produto tinha quando la entrou,
 * e qualquer pessoa o pode mudar a mao. Por isso o servidor **nunca** le
 * precos do pedido: recebe identificadores e quantidades, e tudo o resto —
 * preco, nome, peso, portes — sai da base de dados e de `CONDICOES`. Um
 * carrinho editado da exatamente o mesmo total que um honesto.
 *
 * Nada aqui corrige o pedido em silencio. Uma quantidade acima do stock nao
 * e reduzida, um produto desativado nao desaparece: volta como problema, e
 * quem pediu decide. Uma encomenda que muda sozinha entre o carrinho e o
 * pagamento e uma encomenda que a pessoa nao pediu.
 */

export interface LinhaPedida {
  id: string;
  quantidade: number;
}

/** O que o calculo precisa de saber de cada produto. */
export interface ProdutoParaPreco {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
  weightGrams?: number;
}

export interface LinhaCalculada {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
}

export type Problema =
  /** Nao existe, ou foi desativado. */
  | { tipo: 'indisponivel'; id: string }
  | { tipo: 'stock'; id: string; disponivel: number }
  /** Sem peso nao ha portes: e dado em falta do lado do negocio, nao do cliente. */
  | { tipo: 'sem-peso'; id: string }
  | { tipo: 'acima-do-ultimo-escalao'; gramas: number }
  | { tipo: 'sem-tabela' };

export type Calculo =
  | {
      ok: true;
      linhas: LinhaCalculada[];
      pesoGramas: number;
      subtotalCents: number;
      shippingCents: number;
      totalCents: number;
    }
  | { ok: false; problemas: Problema[] };

/** O mesmo produto em duas linhas conta como uma, com as quantidades somadas. */
function juntar(pedido: readonly LinhaPedida[]): LinhaPedida[] {
  const porId = new Map<string, number>();
  for (const { id, quantidade } of pedido) {
    porId.set(id, (porId.get(id) ?? 0) + quantidade);
  }
  return [...porId].map(([id, quantidade]) => ({ id, quantidade }));
}

/**
 * O calculo, sem base de dados. `produtos` sao os que estao ativos; o que o
 * pedido traga e nao esteja aqui, esta indisponivel.
 *
 * Devolve **todos** os problemas, e nao so o primeiro: quem tem tres coisas
 * a corrigir no carrinho quer saber das tres de uma vez.
 */
export function calcular(
  pedido: readonly LinhaPedida[],
  produtos: readonly ProdutoParaPreco[],
  tabela: readonly Escalao[] | null
): Calculo {
  const porId = new Map(produtos.map((p) => [p.id, p]));
  const problemas: Problema[] = [];
  const linhas: LinhaCalculada[] = [];
  let pesoGramas = 0;
  let pesoCompleto = true;

  for (const { id, quantidade } of juntar(pedido)) {
    const produto = porId.get(id);
    if (!produto) {
      problemas.push({ tipo: 'indisponivel', id });
      continue;
    }
    if (quantidade > produto.stock) {
      problemas.push({ tipo: 'stock', id, disponivel: produto.stock });
    }
    if (produto.weightGrams === undefined) {
      problemas.push({ tipo: 'sem-peso', id });
      pesoCompleto = false;
    } else {
      pesoGramas += produto.weightGrams * quantidade;
    }
    linhas.push({
      productId: id,
      name: produto.name,
      priceCents: produto.priceCents,
      quantity: quantidade,
    });
  }

  let shippingCents: number | null = null;
  if (tabela === null) {
    problemas.push({ tipo: 'sem-tabela' });
  } else if (pesoCompleto) {
    shippingCents = portesPara(pesoGramas, tabela);
    if (shippingCents === null) problemas.push({ tipo: 'acima-do-ultimo-escalao', gramas: pesoGramas });
  }

  if (problemas.length > 0 || shippingCents === null) {
    return { ok: false, problemas };
  }

  const subtotalCents = linhas.reduce((s, l) => s + l.priceCents * l.quantity, 0);
  return {
    ok: true,
    linhas,
    pesoGramas,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
  };
}

/**
 * O calculo, com os produtos lidos da base de dados.
 *
 * Os ids chegam validados pelo `esquemaPedido`; a guarda do `isValid` e para
 * quem chamar isto de outro sitio. A tabela so se passa nos testes: a do
 * negocio ainda e `null`, e com ela nao havia total nenhum para verificar.
 */
export async function calcularEncomenda(
  pedido: readonly LinhaPedida[],
  tabela: readonly Escalao[] | null = CONDICOES.tabelaPortes
): Promise<Calculo> {
  const ids = [...new Set(pedido.map((l) => l.id))].filter((id) =>
    mongoose.Types.ObjectId.isValid(id)
  );

  await connectDB();
  const docs = await Product.find({ _id: { $in: ids }, active: true })
    .select('name priceCents stock weightGrams')
    .lean();

  return calcular(
    pedido,
    docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      priceCents: d.priceCents,
      stock: d.stock,
      weightGrams: d.weightGrams,
    })),
    tabela
  );
}
