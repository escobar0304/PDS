import mongoose from 'mongoose';
import Stripe from 'stripe';
import connectDB from '@/lib/db';
import { requireEnv } from '@/lib/env';
import { mudarEstado } from '@/lib/encomenda';
import { AvisoPagamento, Order } from '@/lib/models';

/**
 * Pagamentos, pela Stripe, com a pagina de pagamento alojada nela
 * (ROADMAP-V2, E4).
 *
 * Tres regras, e o porque de cada uma:
 *
 * 1. **O `stripe.js` nunca carrega no sitio.** A pessoa e levada para a pagina
 *    da Stripe: nao ha cookies da Stripe no nosso dominio, a CSP nao muda, e
 *    os dados do cartao nunca passam por aqui.
 * 2. **"Pago" so vem do aviso da Stripe, com assinatura verificada** — nunca da
 *    pagina para onde a pessoa volta, que qualquer um pode abrir a mao.
 * 3. **O mesmo aviso duas vezes nao faz nada duas vezes.** A Stripe reenvia
 *    ate ter resposta, e pode entregar o mesmo evento em duplicado.
 */

/**
 * Os meios de pagamento. **Sem Multibanco, de proposito, ate haver decisao:**
 * e assincrono — a pessoa recebe uma referencia e paga mais tarde, num
 * multibanco — e a reserva de uma peca dura 30 minutos. Com uma peca unica,
 * ou se segura a peca durante dias a espera de um pagamento que pode nao vir,
 * ou se aceita reembolsar quem pagou depois de ela ter sido vendida. Os avisos
 * assincronos (`async_payment_*`) sao tratados na mesma, para estar pronto.
 */
export const MEIOS_DE_PAGAMENTO = ['card', 'mb_way'] as const;

/**
 * A sessao de pagamento dura o minimo que a Stripe permite (30 minutos,
 * segundo a documentacao da propria biblioteca) mais um de folga pelo
 * relogio. A reserva do stock dura a sessao **mais uma margem**: se as duas
 * acabassem juntas, um pagamento feito no ultimo segundo podia chegar depois
 * de a limpeza ter devolvido a peca ao stock.
 */
export const DURACAO_SESSAO_S = 31 * 60;
export const MARGEM_RESERVA_MS = 10 * 60 * 1000;

let cliente: Stripe | null = null;

/**
 * O cliente da Stripe. `STRIPE_API_HOST`/`_PORT`/`_PROTOCOL` so existem para
 * os testes, que correm contra o `stripe-mock` (o simulador oficial) porque
 * este ambiente nao chega a Stripe.
 */
export function stripe(): Stripe {
  if (cliente) return cliente;
  const host = process.env.STRIPE_API_HOST;
  cliente = new Stripe(requireEnv('STRIPE_SECRET_KEY'), {
    ...(host
      ? {
          host,
          port: process.env.STRIPE_API_PORT ?? '12111',
          protocol: (process.env.STRIPE_API_PROTOCOL as 'http' | 'https' | undefined) ?? 'http',
        }
      : {}),
    maxNetworkRetries: 2,
    timeout: 15_000,
  });
  return cliente;
}

/** So para os testes: esquecer o cliente, para mudar de configuracao. */
export function esquecerCliente() {
  cliente = null;
}

export type Inicio =
  | { ok: true; url: string }
  | { ok: false; motivo: 'nao-existe' | 'ja-nao-esta-por-pagar' };

/**
 * Abre a sessao de pagamento de uma encomenda por pagar, e devolve o endereco
 * da pagina da Stripe.
 *
 * O preco de cada linha vem da encomenda, que o calculou a partir da base de
 * dados (`lib/encomenda.ts`), e nunca do pedido do browser. A chave de
 * idempotencia e a encomenda: pedir duas vezes da a mesma sessao, e nao duas.
 */
export async function iniciarPagamento(
  encomendaId: string,
  baseUrl: string,
  agora = new Date()
): Promise<Inicio> {
  if (!mongoose.Types.ObjectId.isValid(encomendaId)) return { ok: false, motivo: 'nao-existe' };
  await connectDB();

  const e = await Order.findById(encomendaId).lean();
  if (!e) return { ok: false, motivo: 'nao-existe' };
  if (e.status !== 'PENDING') return { ok: false, motivo: 'ja-nao-esta-por-pagar' };

  const linhas: Stripe.Checkout.SessionCreateParams.LineItem[] = e.items.map((l) => ({
    quantity: l.quantity,
    price_data: {
      currency: 'eur',
      unit_amount: l.priceCents,
      product_data: { name: l.medida ? `${l.name} — medida ${l.medida}` : l.name },
    },
  }));
  if (e.shippingCents > 0) {
    linhas.push({
      quantity: 1,
      price_data: { currency: 'eur', unit_amount: e.shippingCents, product_data: { name: 'Portes (CTT)' } },
    });
  }

  const expira = Math.floor(agora.getTime() / 1000) + DURACAO_SESSAO_S;
  const sessao = await stripe().checkout.sessions.create(
    {
      mode: 'payment',
      line_items: linhas,
      payment_method_types: [...MEIOS_DE_PAGAMENTO],
      customer_email: e.customerEmail,
      client_reference_id: encomendaId,
      metadata: { encomendaId, numero: e.numero },
      expires_at: expira,
      locale: 'pt',
      success_url: `${baseUrl}/encomenda/${encomendaId}?estado=pago`,
      cancel_url: `${baseUrl}/carrinho`,
    },
    { idempotencyKey: `sessao-${encomendaId}` }
  );

  await Order.updateOne(
    { _id: encomendaId, status: 'PENDING' },
    { $set: { pagamentoId: sessao.id, reservaAte: new Date(expira * 1000 + MARGEM_RESERVA_MS) } }
  );

  if (!sessao.url) throw new Error('A Stripe não devolveu o endereço da sessão.');
  return { ok: true, url: sessao.url };
}

export type ResultadoAviso = 'processado' | 'repetido' | 'ignorado';

export class AssinaturaInvalida extends Error {
  constructor() {
    super('Aviso de pagamento com assinatura inválida.');
    this.name = 'AssinaturaInvalida';
  }
}

/**
 * Trata um aviso da Stripe. `corpo` tem de ser o texto tal como chegou — a
 * assinatura e sobre os bytes, e um JSON relido e reescrito ja nao bate.
 *
 * O registo do aviso entra antes de o processar, e sai se o processamento
 * falhar: assim um erro nosso deixa a Stripe reenviar, e um duplicado da
 * Stripe nao passa. Mesmo que dois duplicados chegassem juntos, `mudarEstado`
 * so muda o estado uma vez (`lib/encomenda.ts`).
 */
export async function tratarAviso(corpo: string, assinatura: string | null): Promise<ResultadoAviso> {
  let evento: Stripe.Event;
  try {
    evento = stripe().webhooks.constructEvent(
      corpo,
      assinatura ?? '',
      requireEnv('STRIPE_WEBHOOK_SECRET')
    );
  } catch (erro) {
    if (erro instanceof Error && erro.name === 'MissingEnvError') throw erro;
    throw new AssinaturaInvalida();
  }

  const relevantes = [
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'checkout.session.expired',
  ];
  if (!relevantes.includes(evento.type)) return 'ignorado';

  await connectDB();
  try {
    await AvisoPagamento.create({ _id: evento.id, tipo: evento.type, em: new Date() });
  } catch (erro) {
    if ((erro as { code?: number })?.code === 11000) return 'repetido';
    throw erro;
  }

  try {
    const sessao = evento.data.object as Stripe.Checkout.Session;
    switch (evento.type) {
      case 'checkout.session.completed':
        // Com um meio assincrono, "completed" chega com o pagamento por
        // fazer; o que conta e o `async_payment_succeeded` que vem depois.
        if (sessao.payment_status === 'paid') await confirmar(sessao);
        break;
      case 'checkout.session.async_payment_succeeded':
        await confirmar(sessao);
        break;
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired':
        await cancelar(sessao, evento.type === 'checkout.session.expired' ? 'sessão de pagamento expirou' : 'pagamento falhou');
        break;
    }
  } catch (erro) {
    await AvisoPagamento.deleteOne({ _id: evento.id });
    throw erro;
  }
  return 'processado';
}

function idDaEncomenda(sessao: Stripe.Checkout.Session): string | null {
  const id = sessao.client_reference_id ?? sessao.metadata?.encomendaId ?? null;
  return id && mongoose.Types.ObjectId.isValid(id) ? id : null;
}

/**
 * Pago. Antes de avancar, confere o valor: um pagamento que nao bate com o
 * total da encomenda nao a faz avancar — fica marcado para o painel.
 */
async function confirmar(sessao: Stripe.Checkout.Session) {
  const id = idDaEncomenda(sessao);
  if (!id) return;
  const e = await Order.findById(id).select('status totalCents').lean();
  if (!e) return;

  if (sessao.amount_total !== e.totalCents || sessao.currency !== 'eur') {
    await Order.updateOne({ _id: id }, { $set: { pagamentoDivergente: true, pagamentoId: sessao.id } });
    console.error(`Pagamento divergente na encomenda ${id}: ${sessao.amount_total} ${sessao.currency}.`);
    return;
  }

  const r = await mudarEstado(id, 'PROCESSING', 'sistema', 'pagamento confirmado pela Stripe');
  if (r.ok) {
    await Order.updateOne({ _id: id }, { $set: { paymentStatus: 'PAID', pagamentoId: sessao.id } });
    return;
  }
  // Pago depois de a reserva expirar: a encomenda ja foi cancelada e a peca
  // pode ja ter sido vendida. Nao se reabre sozinha — decide o painel.
  const depois = await Order.findById(id).select('status').lean();
  if (depois?.status === 'CANCELLED') {
    await Order.updateOne(
      { _id: id },
      { $set: { paymentStatus: 'PAID', pagamentoId: sessao.id, pagoDepoisDeCancelada: true } }
    );
  }
}

/** Expirou ou falhou: cancela a encomenda por pagar, e o stock volta. */
async function cancelar(sessao: Stripe.Checkout.Session, nota: string) {
  const id = idDaEncomenda(sessao);
  if (!id) return;
  const e = await Order.findById(id).select('status').lean();
  if (e?.status !== 'PENDING') return;
  await mudarEstado(id, 'CANCELLED', 'sistema', nota);
}
