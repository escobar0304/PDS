import { NextResponse } from 'next/server';
import { exigirAdmin } from '@/lib/autorizacao';
import { editarCategoria } from '@/lib/gestao';
import { LIMITES, travar } from '@/lib/limites';
import { respostaDeRecusa } from '@/lib/respostas';
import { esquemaEdicaoCategoria, lerCorpo } from '@/lib/validacao';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const permissao = await exigirAdmin();
  if (!permissao.ok) return permissao.resposta;

  const bloqueio = travar(request, 'admin', LIMITES.administracao, permissao.sessao.id);
  if (bloqueio) return bloqueio;

  const corpo = await lerCorpo(request, esquemaEdicaoCategoria);
  if (!corpo.ok) return NextResponse.json({ error: corpo.erro }, { status: 400 });

  try {
    const r = await editarCategoria((await params).id, corpo.dados);
    return r.ok ? NextResponse.json({ ok: true }) : respostaDeRecusa(r);
  } catch (erro) {
    console.error('Admin: erro ao editar categoria:', erro);
    return NextResponse.json({ error: 'Erro ao editar categoria' }, { status: 500 });
  }
}
