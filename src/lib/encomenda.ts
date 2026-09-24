import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { CONDICOES, type Escalao } from '@/lib/condicoes';
import { Contador, Order, Product } from '@/lib/models';
import { portesPara } from '@/lib/portes';
import { formatarNumero, podePassar, type Autor, type Estado } from '@/lib/transicoes';

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

// ============================================
// RESERVA DE STOCK (E2)
// ============================================

/** Quanto tempo o stock fica preso a espera do pagamento. */
export const PRAZO_RESERVA_MS = 30 * 60 * 1000;

/**
 * Tira as quantidades ao stock, peca a peca, ou nenhuma.
 *
 * Cada peca e uma atualizacao atomica com a condicao na propria consulta
 * (`stock >= quantidade`): duas pessoas a comprar a ultima peca ao mesmo
 * tempo, so uma atualizacao encontra o documento. Nao ha "ler, verificar,
 * escrever", que e onde as duas passavam.
 *
 * Sem transacao, de proposito: o MongoDB so as tem em replica set, o do CI
 * nao e, e o de producao esta por escolher. Se uma peca falhar, as que ja
 * foram tiradas voltam ao stock. Entre uma coisa e outra ha um instante em
 * que o stock parece menor do que e — no pior caso, alguem ve "esgotado"
 * durante milissegundos. O contrario, vender o que nao ha, nao acontece.
 *
 * Devolve os ids que falharam; vazio quer dizer que ficou tudo reservado.
 */
export async function reservarStock(linhas: readonly LinhaCalculada[]): Promise<string[]> {
  await connectDB();
  const tiradas: LinhaCalculada[] = [];

  for (const linha of linhas) {
    const r = await Product.updateOne(
      { _id: linha.productId, active: true, stock: { $gte: linha.quantity } },
      { $inc: { stock: -linha.quantity } }
    );
    if (r.modifiedCount !== 1) {
      await devolverStock(tiradas);
      return [linha.productId];
    }
    tiradas.push(linha);
  }

  return [];
}

/** Devolve as quantidades ao stock. So se chama com o que foi mesmo tirado. */
export async function devolverStock(
  linhas: readonly { productId: unknown; quantity: number }[]
): Promise<void> {
  await Promise.all(
    linhas.map((l) => Product.updateOne({ _id: l.productId }, { $inc: { stock: l.quantity } }))
  );
}

// ============================================
// CRIAR E MUDAR DE ESTADO (E3)
// ============================================

/** O proximo numero do ano. Atomico: nunca da o mesmo duas vezes. */
export async function proximoNumero(agora = new Date()): Promise<string> {
  await connectDB();
  const ano = agora.getFullYear();
  const c = await Contador.findOneAndUpdate(
    { _id: `encomenda-${ano}` },
    { $inc: { valor: 1 } },
    { upsert: true, new: true }
  ).lean();
  return formatarNumero(ano, c!.valor);
}

/**
 * Os dados de quem compra. A validacao do que chega do formulario entra com o
 * checkout (E5); aqui chegam ja validados.
 */
export interface DadosCliente {
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryType: 'PICKUP' | 'SHIPPING';
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostal?: string;
}

export type Criacao =
  | { ok: true; id: string; numero: string; totalCents: number }
  | { ok: false; problemas: Problema[] };

/**
 * Calcula, reserva o stock e cria a encomenda a espera do pagamento.
 *
 * Por esta ordem, e cada passo desfaz os anteriores se falhar: sem stock nao
 * ha encomenda, e uma encomenda que nao se consegue gravar devolve o stock.
 */
export async function criarEncomenda(
  pedido: readonly LinhaPedida[],
  cliente: DadosCliente,
  tabela: readonly Escalao[] | null = CONDICOES.tabelaPortes,
  agora = new Date()
): Promise<Criacao> {
  await connectDB();
  // As reservas que expiraram libertam-se aqui, antes de reservar outra vez.
  // Nao ha tarefa agendada neste projeto; e o sitio onde o stock faz falta.
  await libertarReservasExpiradas(agora);

  const calculo = await calcularEncomenda(pedido, tabela);
  if (!calculo.ok) return calculo;

  const falhadas = await reservarStock(calculo.linhas);
  if (falhadas.length > 0) {
    // Entre calcular e reservar, alguem levou a peca.
    const id = falhadas[0];
    const disponivel = (await Product.findById(id).select('stock').lean())?.stock ?? 0;
    return { ok: false, problemas: [{ tipo: 'stock', id, disponivel }] };
  }

  try {
    const encomenda = await Order.create({
      numero: await proximoNumero(agora),
      ...cliente,
      items: calculo.linhas,
      subtotalCents: calculo.subtotalCents,
      shippingCents: calculo.shippingCents,
      totalCents: calculo.totalCents,
      status: 'PENDING',
      reservaAte: new Date(agora.getTime() + PRAZO_RESERVA_MS),
      historico: [{ para: 'PENDING', em: agora, por: 'cliente' }],
    });
    return {
      ok: true,
      id: encomenda._id.toString(),
      numero: encomenda.numero,
      totalCents: encomenda.totalCents,
    };
  } catch (erro) {
    await devolverStock(calculo.linhas);
    throw erro;
  }
}

export type Mudanca =
  | { ok: true }
  | { ok: false; motivo: 'nao-existe' | 'transicao-proibida' | 'conflito' };

/**
 * Muda o estado, se a tabela de `transicoes.ts` o permitir, e regista-o.
 *
 * A atualizacao so encontra o documento se o estado ainda for o que se leu:
 * duas mudancas ao mesmo tempo, so uma passa, e a outra sabe que perdeu
 * (`conflito`) em vez de escrever por cima. Cancelar devolve o stock — uma
 * vez, porque so quem ganhou a mudanca o devolve.
 */
export async function mudarEstado(
  id: string,
  para: Estado,
  por: Autor,
  nota?: string,
  agora = new Date()
): Promise<Mudanca> {
  if (!mongoose.Types.ObjectId.isValid(id)) return { ok: false, motivo: 'nao-existe' };

  await connectDB();
  const atual = await Order.findById(id).select('status items').lean();
  if (!atual) return { ok: false, motivo: 'nao-existe' };
  if (!podePassar(atual.status, para)) return { ok: false, motivo: 'transicao-proibida' };

  const r = await Order.updateOne(
    { _id: id, status: atual.status },
    {
      $set: { status: para },
      $unset: { reservaAte: '' },
      $push: { historico: { de: atual.status, para, em: agora, por, ...(nota ? { nota } : {}) } },
    }
  );
  if (r.modifiedCount !== 1) return { ok: false, motivo: 'conflito' };

  if (para === 'CANCELLED') await devolverStock(atual.items);
  return { ok: true };
}

/**
 * Cancela as encomendas por pagar cuja reserva expirou, e devolve-lhes o
 * stock. Pode correr duas vezes ao mesmo tempo: cada encomenda so e
 * cancelada — e o stock so e devolvido — por quem ganhar a `mudarEstado`.
 */
export async function libertarReservasExpiradas(agora = new Date()): Promise<number> {
  await connectDB();
  const expiradas = await Order.find({ status: 'PENDING', reservaAte: { $lt: agora } })
    .select('_id')
    .lean();

  let libertadas = 0;
  for (const e of expiradas) {
    const r = await mudarEstado(String(e._id), 'CANCELLED', 'sistema', 'reserva expirada', agora);
    if (r.ok) libertadas++;
  }
  return libertadas;
}
