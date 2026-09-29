import { NextResponse } from 'next/server';
import { LIMITES, travar } from '@/lib/limites';
import { desistirDoPagamento } from '@/lib/pagamento';
import { esquemaDesistencia, lerCorpo } from '@/lib/validacao';

/**
 * Desistir de uma encomenda por pagar: o botao "voltar" da pagina da Stripe
 * traz a pessoa ao carrinho com a chave, e o carrinho chama isto.
 *
 * Nao depende de a loja estar aberta: se fechar entretanto, o stock preso tem
 * de voltar na mesma. E sem a chave, 404 — igual a uma encomenda que nao
 * existe, para nao dizer a quem experimenta quais existem.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const bloqueio = travar(request, 'desistencias', LIMITES.desistencias);
  if (bloqueio) return bloqueio;

  const corpo = await lerCorpo(request, esquemaDesistencia);
  if (!corpo.ok) return NextResponse.json({ error: corpo.erro }, { status: 400 });

  try {
    const r = await desistirDoPagamento((await params).id, corpo.dados.chave);
    if (r.ok) return NextResponse.json({ ok: true });
    if (r.motivo === 'nao-existe') {
      return NextResponse.json({ error: 'Encomenda não encontrada.' }, { status: 404 });
    }
    return NextResponse.json(
      {
        error:
          r.motivo === 'ja-pago'
            ? 'Esta encomenda já foi paga.'
            : 'Esta encomenda já não está à espera de pagamento.',
        motivo: r.motivo,
      },
      { status: 409 }
    );
  } catch (erro) {
    console.error('Desistência: erro:', erro);
    return NextResponse.json({ error: 'Erro ao desistir da encomenda.' }, { status: 500 });
  }
}
