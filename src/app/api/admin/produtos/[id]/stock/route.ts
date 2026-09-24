import { NextResponse } from 'next/server';
import { exigirAdmin } from '@/lib/autorizacao';
import { movimentar, movimentosDe } from '@/lib/gestao';
import { LIMITES, travar } from '@/lib/limites';
import { respostaDeRecusa } from '@/lib/respostas';
import { esquemaMovimento, lerCorpo } from '@/lib/validacao';

/** O historico de movimentos do produto. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const permissao = await exigirAdmin();
  if (!permissao.ok) return permissao.resposta;

  const bloqueio = travar(request, 'admin', LIMITES.administracao, permissao.sessao.id);
  if (bloqueio) return bloqueio;

  try {
    const movimentos = await movimentosDe((await params).id);
    return movimentos
      ? NextResponse.json(movimentos, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
      : NextResponse.json({ error: 'Não existe.' }, { status: 404 });
  } catch (erro) {
    console.error('Admin: erro ao ler movimentos:', erro);
    return NextResponse.json({ error: 'Erro ao ler movimentos' }, { status: 500 });
  }
}

/**
 * Um movimento: "-1, vendido na loja", "+5, entrada". Nunca "o stock passa a
 * ser 3" — ver `lib/stock.ts`.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const permissao = await exigirAdmin();
  if (!permissao.ok) return permissao.resposta;

  const bloqueio = travar(request, 'admin', LIMITES.administracao, permissao.sessao.id);
  if (bloqueio) return bloqueio;

  const corpo = await lerCorpo(request, esquemaMovimento);
  if (!corpo.ok) return NextResponse.json({ error: corpo.erro }, { status: 400 });

  try {
    const r = await movimentar((await params).id, corpo.dados, `admin:${permissao.sessao.id}`);
    return r.ok ? NextResponse.json({ stock: r.stock }) : respostaDeRecusa(r);
  } catch (erro) {
    console.error('Admin: erro ao movimentar stock:', erro);
    return NextResponse.json({ error: 'Erro ao movimentar stock' }, { status: 500 });
  }
}
