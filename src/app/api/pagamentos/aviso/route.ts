import { NextResponse } from 'next/server';
import { LIMITES, travar } from '@/lib/limites';
import { AssinaturaInvalida, tratarAviso } from '@/lib/pagamento';

/**
 * Os avisos da Stripe sobre pagamentos (ROADMAP-V2, E4).
 *
 * Nao passa por `lerCorpo`, e e a unica rota isenta disso por essa razao: a
 * assinatura e sobre o texto tal como chegou, e validar o JSON primeiro
 * obrigava a le-lo como objeto. O que o valida e a assinatura, verificada em
 * `tratarAviso` antes de qualquer coisa.
 *
 * Responde 2xx a tudo o que processou ou decidiu ignorar — senao a Stripe
 * reenvia — e 400 so a assinatura invalida. Um erro nosso da 500, e a Stripe
 * volta a tentar mais tarde.
 */
export async function POST(request: Request) {
  const bloqueio = travar(request, 'avisos-pagamento', LIMITES.avisosPagamento);
  if (bloqueio) return bloqueio;

  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Pagamentos por configurar.' }, { status: 503 });
  }

  const corpo = await request.text();
  try {
    const resultado = await tratarAviso(corpo, request.headers.get('stripe-signature'));
    return NextResponse.json({ resultado });
  } catch (erro) {
    if (erro instanceof AssinaturaInvalida) {
      return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 });
    }
    console.error('Aviso de pagamento: erro ao processar:', erro);
    return NextResponse.json({ error: 'Erro ao processar.' }, { status: 500 });
  }
}
