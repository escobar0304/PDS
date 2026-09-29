import connectDB from '@/lib/db';
import { CONDICOES } from '@/lib/condicoes';
import {
  textoDaConfirmacao,
  textoDaExpedicao,
  textoDoReembolso,
  textoParaALoja,
  type AvisoLoja,
  type EncomendaParaAviso,
} from '@/lib/confirmacao';
import { EMPRESA } from '@/lib/empresa';
import { estadoDaLoja } from '@/lib/loja';
import { Order } from '@/lib/models';
import { SITE_URL } from '@/lib/site';
import { resumir, resumosIguais } from '@/lib/tokens';
import { enviar } from '@/services/mailer';

/**
 * Os emails de uma encomenda paga: a confirmacao a quem comprou, e o aviso a
 * loja (ROADMAP-V2, P1).
 *
 * **Cada um sai uma vez.** Antes de enviar, marca-se a data com uma condicao
 * na propria consulta (`confirmacaoEnviadaEm` ainda vazio): dois avisos da
 * Stripe ao mesmo tempo, so um envia. Se o envio falhar, a marca sai e o erro
 * sobe — `tratarAviso` responde 500, e a Stripe volta a entregar o aviso mais
 * tarde. **A fila de novas tentativas e a da Stripe**, que insiste durante
 * dias; nao ha outra neste projeto.
 *
 * O pior caso e o servidor cair entre marcar e enviar: o email fica por
 * enviar sem ninguem saber. E o preco de nunca enviar duas vezes.
 */

type Campo = 'confirmacaoEnviadaEm' | 'avisoLojaEnviadoEm' | 'avisoExpedicaoEm' | 'avisoReembolsoEm';

/** Envia, se ainda ninguem enviou. Devolve se enviou agora. */
async function umaVez(id: string, campo: Campo, envio: () => Promise<void>): Promise<boolean> {
  const marcada = await Order.updateOne(
    { _id: id, [campo]: { $exists: false } },
    { $set: { [campo]: new Date() } }
  );
  if (marcada.modifiedCount !== 1) return false;
  try {
    await envio();
    return true;
  } catch (erro) {
    await Order.updateOne({ _id: id }, { $unset: { [campo]: '' } });
    throw erro;
  }
}

type Lida = NonNullable<Awaited<ReturnType<typeof ler>>>;

function ler(id: string) {
  return Order.findById(id).select('+chaveHash').lean();
}

function paraAviso(e: Lida): EncomendaParaAviso {
  return {
    numero: e.numero,
    criadaEm: e.createdAt,
    customerName: e.customerName,
    customerEmail: e.customerEmail,
    customerPhone: e.customerPhone,
    shippingAddress: e.shippingAddress,
    shippingPostal: e.shippingPostal,
    shippingCity: e.shippingCity,
    items: e.items.map((l) => ({ name: l.name, medida: l.medida, priceCents: l.priceCents, quantity: l.quantity })),
    subtotalCents: e.subtotalCents,
    shippingCents: e.shippingCents,
    totalCents: e.totalCents,
  };
}

/** A resposta a um email da loja vai para o contacto dela. */
const resposta = () => (EMPRESA.email ? { responderPara: EMPRESA.email } : {});

/**
 * O email de que a encomenda saiu, com o seguimento. Nao e obrigatorio por
 * lei, mas e o que diz a pessoa desde quando contam os 14 dias. Devolve se
 * enviou agora; um erro sobe, e o painel oferece enviar outra vez.
 */
export async function avisarExpedicao(id: string): Promise<boolean> {
  await connectDB();
  const e = await ler(id);
  if (!e || e.status !== 'SHIPPED' || !e.seguimento) return false;
  const { assunto, texto } = textoDaExpedicao(paraAviso(e), e.seguimento);
  return umaVez(id, 'avisoExpedicaoEm', () => enviar({ para: e.customerEmail, assunto, texto, ...resposta() }));
}

/** O email de que o valor foi devolvido. Como o de cima. */
export async function avisarReembolso(id: string): Promise<boolean> {
  await connectDB();
  const e = await ler(id);
  if (!e || e.paymentStatus !== 'REFUNDED') return false;
  const { assunto, texto } = textoDoReembolso(paraAviso(e));
  return umaVez(id, 'avisoReembolsoEm', () => enviar({ para: e.customerEmail, assunto, texto, ...resposta() }));
}

/** Qual o aviso a loja, pelo estado da encomenda. `null` se nao ha nenhum a dar. */
function avisoDaLoja(e: {
  paymentStatus: string;
  status: string;
  pagoDepoisDeCancelada?: boolean;
  pagamentoDivergente?: boolean;
}): AvisoLoja | null {
  if (e.pagamentoDivergente) return 'valor-divergente';
  if (e.pagoDepoisDeCancelada) return 'paga-depois-de-cancelada';
  if (e.paymentStatus === 'PAID' && e.status !== 'CANCELLED') return 'paga';
  return null;
}

/**
 * Envia o que estiver por enviar. Chama-se depois de cada aviso de
 * pagamento; chamar outra vez nao repete nada.
 *
 * `chave` vem dos metadados da sessao da Stripe, e so entra no email se for
 * mesmo a desta encomenda. `pagoCents`, o valor que a Stripe diz ter
 * cobrado, so serve para o aviso de valor divergente.
 */
export async function enviarAvisos(
  id: string,
  { chave, pagoCents }: { chave?: string | null; pagoCents?: number | null } = {}
): Promise<void> {
  await connectDB();
  const e = await ler(id);
  if (!e) return;

  const dados = paraAviso(e);

  const paga = e.paymentStatus === 'PAID' && e.status !== 'CANCELLED' && !e.pagamentoDivergente;
  if (paga) {
    const chaveCerta = chave && e.chaveHash && resumosIguais(e.chaveHash, resumir(chave));
    const loja = estadoDaLoja();
    const { assunto, texto } = textoDaConfirmacao(dados, {
      // O prazo com que a loja estava a vender: o do ensaio, no ensaio.
      prazoEntrega: loja.aberta ? loja.condicoes.prazoEntrega : (CONDICOES.prazoEntrega ?? '(por preencher)'),
      ligacao: chaveCerta ? `${SITE_URL}/encomenda/${id}?chave=${chave}` : null,
    });
    await umaVez(id, 'confirmacaoEnviadaEm', () =>
      enviar({
        para: e.customerEmail,
        assunto,
        texto,
        // Desistir "respondendo a este email" so funciona se a resposta
        // chegar ao contacto da loja.
        ...resposta(),
      })
    );
  }

  const tipo = avisoDaLoja(e);
  const destino = process.env.ADMIN_EMAIL;
  if (tipo && destino) {
    const { assunto, texto } = textoParaALoja(dados, tipo, pagoCents);
    await umaVez(id, 'avisoLojaEnviadoEm', () =>
      enviar({ para: destino, assunto, texto, responderPara: e.customerEmail })
    );
  }
}
