import mongoose, { type FilterQuery } from 'mongoose';
import { avisarExpedicao, avisarReembolso } from '@/lib/avisos';
import connectDB from '@/lib/db';
import { mudarEstado } from '@/lib/encomenda';
import { Order, type IOrder } from '@/lib/models';
import { reembolsarPagamento } from '@/lib/pagamento';
import type { Autor } from '@/lib/transicoes';

/**
 * O painel de encomendas (ROADMAP-V2, P3): ver, expedir, dar por entregue,
 * cancelar e devolver o dinheiro.
 *
 * Cada acao passa por `mudarEstado`, que so faz o que `transicoes.ts` deixa
 * e regista quem o fez. Nada aqui escreve o estado por outro caminho.
 */

export type Filtro = 'por-preparar' | 'a-resolver' | 'enviadas' | 'por-pagar' | 'todas';

export const FILTROS: Record<Filtro, { rotulo: string; consulta: FilterQuery<IOrder> }> = {
  'por-preparar': { rotulo: 'Por preparar', consulta: { status: 'PROCESSING' } },
  // Pago mas cancelado (chegou tarde, ou o reembolso falhou a meio), ou pago
  // com outro valor: dinheiro que alguem tem de resolver.
  'a-resolver': {
    rotulo: 'A resolver',
    consulta: {
      $or: [
        { status: 'CANCELLED', paymentStatus: 'PAID' },
        { pagamentoDivergente: true, paymentStatus: { $ne: 'REFUNDED' } },
      ],
    },
  },
  enviadas: { rotulo: 'Enviadas', consulta: { status: 'SHIPPED' } },
  'por-pagar': { rotulo: 'Por pagar', consulta: { status: 'PENDING' } },
  todas: { rotulo: 'Todas', consulta: {} },
};

export function eFiltro(f: unknown): f is Filtro {
  return typeof f === 'string' && Object.hasOwn(FILTROS, f);
}

/** As mais recentes primeiro. Duzentas chegam a uma loja deste tamanho. */
export async function listarEncomendas(filtro: Filtro) {
  await connectDB();
  return Order.find(FILTROS[filtro].consulta)
    .sort({ createdAt: -1 })
    .limit(200)
    .select('numero status paymentStatus customerName totalCents createdAt pagoDepoisDeCancelada pagamentoDivergente items.quantity')
    .lean();
}

/** Quantas ha em cada filtro que pede trabalho, para o painel as mostrar. */
export async function contarEncomendas() {
  await connectDB();
  const [porPreparar, aResolver] = await Promise.all([
    Order.countDocuments(FILTROS['por-preparar'].consulta),
    Order.countDocuments(FILTROS['a-resolver'].consulta),
  ]);
  return { porPreparar, aResolver };
}

export async function encomendaDoPainel(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await connectDB();
  return Order.findById(id).lean();
}

export type Acao =
  | { ok: true; avisoFalhou?: boolean }
  | { ok: false; motivo: 'nao-existe' | 'estado-errado' | 'conflito' };

function recusa(m: 'nao-existe' | 'transicao-proibida' | 'conflito'): Acao {
  return { ok: false, motivo: m === 'transicao-proibida' ? 'estado-errado' : m };
}

/**
 * Um email que falha nao desfaz a acao: a encomenda saiu, ou o dinheiro foi
 * devolvido, na mesma. O painel diz que o email ficou por enviar, e oferece
 * envia-lo outra vez.
 */
async function comAviso(aviso: () => Promise<boolean>): Promise<Acao> {
  try {
    await aviso();
    return { ok: true };
  } catch (erro) {
    console.error('Painel: o email não saiu:', erro);
    return { ok: true, avisoFalhou: true };
  }
}

/** Saiu pelos CTT: o seguimento fica, e a pessoa recebe-o por email. */
export async function expedir(id: string, seguimento: string, por: Autor): Promise<Acao> {
  const r = await mudarEstado(id, 'SHIPPED', por, `CTT: ${seguimento}`);
  if (!r.ok) return recusa(r.motivo);
  await Order.updateOne({ _id: id }, { $set: { seguimento } });
  return comAviso(() => avisarExpedicao(id));
}

/** Entregue. */
export async function concluir(id: string, por: Autor): Promise<Acao> {
  const r = await mudarEstado(id, 'COMPLETED', por);
  return r.ok ? { ok: true } : recusa(r.motivo);
}

/**
 * Cancelar e devolver tudo o que foi pago.
 *
 * **Primeiro cancela, depois devolve.** Pela ordem contraria, um reembolso
 * feito e um cancelamento que perdesse para uma expedicao ao mesmo tempo
 * deixavam uma encomenda enviada e paga de volta. Assim, se o reembolso
 * falhar, a encomenda fica cancelada e paga — em "a resolver" —, e o botao
 * volta a tentar; a Stripe nunca devolve duas vezes (`reembolsarPagamento`).
 *
 * Uma encomenda ja enviada nao se reembolsa aqui: isso e a desistencia (P4),
 * que tem prazos e regras de portes proprios.
 */
export async function reembolsar(id: string, por: Autor, nota?: string): Promise<Acao> {
  const e = await encomendaDoPainel(id);
  if (!e) return { ok: false, motivo: 'nao-existe' };
  if (e.paymentStatus !== 'PAID' || !e.pagamentoId) return { ok: false, motivo: 'estado-errado' };

  if (e.status === 'PROCESSING') {
    const r = await mudarEstado(id, 'CANCELLED', por, nota || 'cancelada e reembolsada pelo painel');
    if (!r.ok) return recusa(r.motivo);
  } else if (e.status !== 'CANCELLED') {
    return { ok: false, motivo: 'estado-errado' };
  }

  const reembolsoId = await reembolsarPagamento(e.pagamentoId, id);
  const marcada = await Order.updateOne(
    { _id: id, paymentStatus: 'PAID' },
    { $set: { paymentStatus: 'REFUNDED', reembolsoId } }
  );
  if (marcada.modifiedCount !== 1) return { ok: false, motivo: 'conflito' };
  return comAviso(() => avisarReembolso(id));
}

/** Enviar outra vez o email que falhou. */
export async function reenviarAviso(id: string): Promise<Acao> {
  const e = await encomendaDoPainel(id);
  if (!e) return { ok: false, motivo: 'nao-existe' };
  if (e.status === 'SHIPPED') return comAviso(() => avisarExpedicao(id));
  if (e.paymentStatus === 'REFUNDED') return comAviso(() => avisarReembolso(id));
  return { ok: false, motivo: 'estado-errado' };
}
