import { NextResponse } from 'next/server';
import { exigirAdmin } from '@/lib/autorizacao';
import { criarProduto, listarProdutos } from '@/lib/gestao';
import { LIMITES, travar } from '@/lib/limites';
import { respostaDeRecusa } from '@/lib/respostas';
import { esquemaNovoProduto, lerCorpo } from '@/lib/validacao';

/** Todos os produtos, ativos e desativados, com o reservado online. */
export async function GET(request: Request) {
  const permissao = await exigirAdmin();
  if (!permissao.ok) return permissao.resposta;

  const bloqueio = travar(request, 'admin', LIMITES.administracao, permissao.sessao.id);
  if (bloqueio) return bloqueio;

  try {
    return NextResponse.json(await listarProdutos(), {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (erro) {
    console.error('Admin: erro ao listar produtos:', erro);
    return NextResponse.json({ error: 'Erro ao listar produtos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const permissao = await exigirAdmin();
  if (!permissao.ok) return permissao.resposta;

  const bloqueio = travar(request, 'admin', LIMITES.administracao, permissao.sessao.id);
  if (bloqueio) return bloqueio;

  const corpo = await lerCorpo(request, esquemaNovoProduto);
  if (!corpo.ok) return NextResponse.json({ error: corpo.erro }, { status: 400 });

  try {
    const r = await criarProduto(corpo.dados, `admin:${permissao.sessao.id}`);
    return r.ok ? NextResponse.json({ id: r.id }, { status: 201 }) : respostaDeRecusa(r);
  } catch (erro) {
    console.error('Admin: erro ao criar produto:', erro);
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 });
  }
}
