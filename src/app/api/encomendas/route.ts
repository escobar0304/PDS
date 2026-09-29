import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { criarEncomenda, mudarEstado } from '@/lib/encomenda';
import { LIMITES, travar } from '@/lib/limites';
import { estadoDaLoja } from '@/lib/loja';
import { iniciarPagamento } from '@/lib/pagamento';
import { SITE_URL } from '@/lib/site';
import { esquemaCheckout, lerCorpo } from '@/lib/validacao';

/**
 * Encomendar (ROADMAP-V2, E5): cria a encomenda, reserva o stock e abre o
 * pagamento na Stripe. Devolve o endereco da pagina de pagamento.
 *
 * Nada do que chega decide um preco: o total e calculado aqui, a partir da
 * base de dados, e o que a pessoa viu so serve para recusar se nao bater
 * (`esquemaCheckout`). Com a loja fechada responde 503 antes de ler o pedido
 * — a pagina de checkout nem existe, mas a rota nao conta com isso.
 */
export async function POST(request: Request) {
  const bloqueio = travar(request, 'encomendas', LIMITES.encomendas);
  if (bloqueio) return bloqueio;

  const loja = estadoDaLoja();
  if (!loja.aberta) {
    return NextResponse.json({ error: 'A loja online ainda não aceita encomendas.' }, { status: 503 });
  }

  const corpo = await lerCorpo(request, esquemaCheckout);
  if (!corpo.ok) return NextResponse.json({ error: corpo.erro }, { status: 400 });
  const { linhas, cliente, totalVistoCents } = corpo.dados;

  try {
    // Com conta, a encomenda fica ligada a ela. Sem conta, compra-se na mesma.
    const sessao = await getServerSession(authOptions);
    const userId = (sessao?.user as { id?: string } | undefined)?.id;

    const r = await criarEncomenda(
      linhas,
      {
        ...(userId ? { userId } : {}),
        customerName: cliente.nome,
        customerEmail: cliente.email,
        customerPhone: cliente.telefone,
        deliveryType: 'SHIPPING',
        shippingAddress: cliente.morada,
        shippingCity: cliente.localidade,
        shippingPostal: cliente.codigoPostal,
      },
      loja.condicoes.tabelaPortes,
      new Date(),
      totalVistoCents
    );
    if (!r.ok) {
      return NextResponse.json(
        { error: 'A encomenda não pôde ser feita.', problemas: r.problemas },
        { status: 409 }
      );
    }

    try {
      const p = await iniciarPagamento(r.id, r.chave, SITE_URL);
      if (!p.ok) throw new Error(`pagamento não iniciado: ${p.motivo}`);
      return NextResponse.json({ url: p.url }, { status: 201 });
    } catch (erro) {
      // Sem pagina de pagamento, a encomenda nao tem como avancar: cancela-se
      // ja, e o stock volta, em vez de ficar preso ate a reserva expirar.
      await mudarEstado(r.id, 'CANCELLED', 'sistema', 'o pagamento não abriu');
      console.error('Encomenda: o pagamento não abriu:', erro);
      return NextResponse.json(
        { error: 'Não foi possível abrir o pagamento. Nada foi cobrado: pode tentar outra vez.' },
        { status: 502 }
      );
    }
  } catch (erro) {
    console.error('Encomenda: erro ao criar:', erro);
    return NextResponse.json({ error: 'Erro ao criar a encomenda.' }, { status: 500 });
  }
}
